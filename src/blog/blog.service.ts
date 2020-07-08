import { Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create_article.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleRepository } from './article.repository';
import { User } from 'src/user/user.entity';
import { Article } from './article.entity';
import { UpdateArticleDto } from './dto/update_article.dto';
import { CreateCategoryDto } from './dto/create_category.dto';
import { CategoryRepository } from './category.repository';
import { CreateTagDto } from './dto/create_tag.dto';
import { TagRepository } from './tag.repository';
import { UpdateTagDto } from './dto/update_tag.dto';
import { UpdateCategoryDto } from './dto/update_category.dto';
const getSlug = require('speakingurl');

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(ArticleRepository)
    private articleRepository: ArticleRepository,
    @InjectRepository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @InjectRepository(TagRepository) private tagRepository: TagRepository,
  ) {}

  saveArticle(createArticleDto: CreateArticleDto, user: User): Promise<void> {
    if (!createArticleDto.thumbnail) delete createArticleDto.thumbnail;
    return this.articleRepository.saveArticle(createArticleDto, user);
  }

  getAllArticles(): Promise<Article[]> {
    return this.articleRepository.getAllArticles();
  }

  getThumbnailArticle() {
    return this.articleRepository.getThumbnailArticle();
  }

  getArticleById(idOfArticleNeedEdit: number) {
    return this.articleRepository.findOne(
      { id: idOfArticleNeedEdit },
      { relations: ['category', 'tags'] },
    );
  }

  getArticleBySlug(slug: string) {
    return this.articleRepository.findBySlug(slug);
  }

  updateArticle(
    idOfArticleNeedEdit: number,
    updateArticleDto: UpdateArticleDto,
  ) {
    return this.articleRepository.updateArticle(
      idOfArticleNeedEdit,
      updateArticleDto,
    );
  }

  deleteArticle(idOfArticleNeedDelete: number) {
    return this.articleRepository.delete({ id: idOfArticleNeedDelete });
  }

  createCategory(createCategoryDto: CreateCategoryDto) {
    return this.categoryRepository.createCategory(createCategoryDto);
  }

  getAllCategories() {
    return this.categoryRepository.find({ order: { created_at: 'DESC' } });
  }

  updateCategory(updateCategoryDto: UpdateCategoryDto) {
    const { id, ...data } = updateCategoryDto;
    return this.categoryRepository.update({ id: updateCategoryDto.id }, data);
  }

  deleteCategoryById(id: number) {
    return this.categoryRepository.delete({ id });
  }

  createTag(createTagDto: CreateTagDto) {
    return this.tagRepository.createTag(createTagDto);
  }

  getAllTags() {
    return this.tagRepository.find({ order: { created_at: 'DESC' } });
  }

  updateTag(updateTagDto: UpdateTagDto) {
    const { id, ...data } = updateTagDto;
    return this.tagRepository.update({ id: updateTagDto.id }, data);
  }

  deleteTagById(id: number) {
    return this.tagRepository.delete({ id });
  }
}
