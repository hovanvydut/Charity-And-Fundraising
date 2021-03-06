import { EntityRepository, Repository, Like } from 'typeorm';
import { Article } from './article.entity';
import { User } from 'src/user/user.entity';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { UpdateArticleDto } from './dto/update_article.dto';
import { ConditionQuery } from './dto/condition_query.dto';
const getSlug = require('speakingurl');

@EntityRepository(Article)
export class ArticleRepository extends Repository<Article> {
  private logger = new Logger();

  async saveArticle(createArticleDto, user: User): Promise<void> {
    const {
      title,
      description,
      content,
      thumbnail,
      category,
      tags,
    } = createArticleDto;
    const article = new Article();

    article.title = title;
    article.description = description;
    article.content = content;
    article.thumbnail = thumbnail;
    article.author = user;
    article.slug = getSlug(`${article.title}`);
    article.category = category;

    try {
      await this.save(article);
      await this.createQueryBuilder()
        .relation(Article, 'tags')
        .of(article)
        .add(tags);
    } catch (error) {
      this.logger.error(error, error.stack, 'ArticleRepository');
      throw new InternalServerErrorException();
    }
  }

  async updateArticle(
    idOfArticleNeedEdit: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    const {
      title,
      description,
      content,
      thumbnail,
      category,
      tags,
    } = updateArticleDto;
    const article = new Article();
    console.log(category);
    article.title = title;
    article.description = description;
    article.content = content;
    article.thumbnail = thumbnail;
    article.slug = getSlug(`${article.title}`);

    await this.createQueryBuilder()
      .update()
      .set(article)
      .where({ id: idOfArticleNeedEdit })
      .execute();
    await this.createQueryBuilder()
      .relation(Article, 'category')
      .of({ id: idOfArticleNeedEdit })
      .set(category);
    const actualRelationships = await this.createQueryBuilder()
      .relation(Article, 'tags')
      .of({ id: idOfArticleNeedEdit })
      .loadMany();
    return this.createQueryBuilder()
      .relation(Article, 'tags')
      .of({ id: idOfArticleNeedEdit })
      .addAndRemove(tags, actualRelationships);
  }

  getAllArticles(): Promise<Article[]> {
    const query = this.createQueryBuilder('article');
    return query
      .select(['user.name', 'user.id', 'article.title', 'article.id'])
      .innerJoin('article.author', 'user')
      .orderBy('article.created_at', 'DESC')
      .getMany();
  }

  getThumbnailArticle(conditionQuery: ConditionQuery, limit?: number) {
    const query = this.createQueryBuilder('article');

    query
      .select([
        'user.name',
        'user.id',
        'article.title',
        'article.id',
        'article.thumbnail',
        'article.description',
        'article.slug',
        'article.created_at',
        'category.id',
        'category.name',
      ])
      .leftJoin('article.author', 'user')
      .leftJoinAndSelect('article.tags', 'tag');

    if (conditionQuery.categorySlug)
      query.innerJoin('article.category', 'category', 'category.slug = :slug', {
        slug: conditionQuery.categorySlug,
      });
    else query.innerJoin('article.category', 'category');

    // if (conditionQuery.tagSlug)
    //   query.andWhere('(:slug) IN article.tags', {
    //     slug: conditionQuery.tagSlug,
    //   });

    if (limit) {
      query.limit(limit);
    }

    if (conditionQuery.titleSlug)
      query.where({ slug: Like(conditionQuery.titleSlug) });

    return query.orderBy('article.created_at', 'DESC').getMany();
  }

  findBySlug(slug: string) {
    return this.createQueryBuilder('article')
      .select([
        'user.id',
        'user.name',
        'user.avatar',
        'article.id',
        'article.title',
        'article.slug',
        'article.description',
        'article.content',
        'article.thumbnail',
        'article.created_at',
      ])
      .innerJoin('article.author', 'user')
      .where('article.slug = :slug', { slug })
      .leftJoinAndSelect('article.tags', 'tag')
      .orderBy('article.created_at', 'DESC')
      .getOne();
  }
}
