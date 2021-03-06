import {
  Controller,
  Get,
  Render,
  UseGuards,
  UseFilters,
  Req,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Redirect,
  Param,
  ParseIntPipe,
  Patch,
  Res,
  Delete,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RoleEnum } from 'src/user/other/user_role.enum';
import { AuthenticatedGuard } from 'src/auth/guard/authenticated.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AuthExceptionFilter } from 'src/auth/filter/auth_exceptions.filter';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from './dto/create_article.dto';
import { BlogService } from './blog.service';
import { GetUser } from 'src/user/other/get_user.decorator';
import { User } from 'src/user/user.entity';
import { Article } from './article.entity';
import { UpdateArticleDto } from './dto/update_article.dto';
import { multerOptions } from 'src/config/multer.config.';
import * as fs from 'fs';
import cloudinary from './../config/cloudinary.config';
import { GetFlashMessage } from 'src/user/other/get_flash_message';
import { CreateCategoryDto } from './dto/create_category.dto';
import { CreateTagDto } from './dto/create_tag.dto';
import { UpdateTagDto } from './dto/update_tag.dto';
import { UpdateTagPipe } from './pipe/update_tag.pipe';
import { UpdateCategoryPipe } from './pipe/update_category.pipe';
import { UpdateCategoryDto } from './dto/update_category.dto';
import { FlashMessageDto } from 'src/user/dto/flash_message';
import { CreateArticlePipe } from './pipe/create_article.pipe';
import { UpdateArticlePipe } from './pipe/update_article.pipe';
import DiscordLogger from 'src/config/logger/discord.logger';
import { MessageDiscordLogger } from 'src/config/logger/message.discord.logger.dto';
const tinyAPIKey = '2915bg1q653j3923vjzn1e30iaq6aijt5sd0c429mcvdh9ov';

@Controller('admin/blog')
@Roles(RoleEnum.ADMIN, RoleEnum.MOD)
@UseGuards(AuthenticatedGuard, RolesGuard)
@UseFilters(AuthExceptionFilter)
export class BlogController {
  private discordLogger = new DiscordLogger();

  constructor(private blogService: BlogService) {}
  //! Viet interceptor dinh kem object message flash each response

  @Get('my-articles')
  @Render('admin/page/blog/articles')
  viewMyArticles(@Req() req) {
    const messageFlash = req.flash('message');
    return {
      user: req.user,
      message: {
        status: messageFlash[0],
        contents: messageFlash.slice(1),
      },
    };
  }

  @Get('write-article')
  @Render('admin/page/blog/write_article')
  async viewWriteArticle(
    @Req() req,
    @GetFlashMessage() message: FlashMessageDto,
  ) {
    const categories = await this.blogService.getAllCategories();
    const tags = await this.blogService.getAllTags();
    return {
      user: req.user,
      message,
      tinyAPIKey,
      categories,
      tags,
    };
  }

  @Post('write-article')
  @Redirect('/admin/blog/articles')
  async saveArticle(
    @Body(CreateArticlePipe) createArticleDto: CreateArticleDto,
    @GetUser() user: User,
    @Req() req,
  ) {
    await this.blogService.saveArticle(createArticleDto, user);

    const logMessage: MessageDiscordLogger = new MessageDiscordLogger(
      `${RoleEnum[user.role]} @${user.name} has created NEW ARTICLE #${
        createArticleDto.title
      } #email: ${user.email}`,
    );
    this.discordLogger.log(logMessage);
    req.flash('message', ['success', 'Bài viết đã lưu']);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadImage(@UploadedFile() file) {
    const uploadedImg = await cloudinary.uploader.upload(file.path, {
      tags: 'thumbnail',
      folder: 'Charity_And_Fundraising/upload/article',
    });
    const thumbnailUrl = uploadedImg.url;
    console.log(thumbnailUrl);
    fs.unlinkSync(file.path);
    return { location: thumbnailUrl };
  }

  @Get('articles')
  @Render('admin/page/blog/articles')
  async viewArticles(@Req() req, @GetUser() user: User) {
    const messageFlash = req.flash('message');
    const articles: Article[] = await this.blogService.getAllArticles();
    return {
      user,
      message: {
        status: messageFlash[0],
        contents: messageFlash.slice(1),
      },
      articles,
    };
  }

  @Get('articles/:id/edit')
  @Render('admin/page/blog/edit_article')
  async editArticle(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) idOfArticleNeedEdit: number,
    @Req() req,
    @GetFlashMessage() message: FlashMessageDto,
  ) {
    const articleData = await this.blogService.getArticleById(
      idOfArticleNeedEdit,
    );
    const tags = await this.blogService.getAllTags();
    const categories = await this.blogService.getAllCategories();
    return {
      user,
      articleData,
      message,
      categories,
      tags,
    };
  }

  @Patch('articles/:id/update')
  async updateArticle(
    @Param('id', ParseIntPipe) idOfArticleNeedEdit: number,
    @Body(UpdateArticlePipe) updateArticleDto: UpdateArticleDto,
    @Req() req,
    @Res() res,
    @GetUser() user: User,
  ) {
    await this.blogService.updateArticle(idOfArticleNeedEdit, updateArticleDto);

    const logMessage: MessageDiscordLogger = new MessageDiscordLogger(
      `${RoleEnum[user.role]} @${user.name} UPDATE ARTICLE #${
        updateArticleDto.title
      } #email: ${user.email}`,
    );
    this.discordLogger.log(logMessage);
    req.flash('message', ['success', 'Cập nhật bài viết thành công']);

    return res.redirect(`/admin/blog/articles/${idOfArticleNeedEdit}/edit`);
  }

  @Delete('articles/:id/delete')
  async deleteArticle(
    @Param('id', ParseIntPipe) idOfArticleNeedDelete: number,
    @Req() req,
    @Res() res,
    @GetUser() user: User,
  ) {
    await this.blogService.deleteArticle(idOfArticleNeedDelete);

    const logMessage: MessageDiscordLogger = new MessageDiscordLogger(
      `${RoleEnum[user.role]} @${
        user.name
      } DELETE ARTICLE which has id = ${idOfArticleNeedDelete} #email: ${
        user.email
      }`,
    );
    this.discordLogger.log(logMessage);
    req.flash('message', ['success', 'Xóa bài viết thành công']);

    return res.redirect(`/admin/blog/articles`);
  }

  @Get('category-and-tag')
  @Render('admin/page/blog/categoryAndTag')
  async viewCategoryAndTag(@GetUser() user: User, @GetFlashMessage() message) {
    const tags = await this.blogService.getAllTags();
    const categories = await this.blogService.getAllCategories();
    return {
      user,
      message,
      tags,
      categories,
    };
  }

  // CATEGORY
  @Post('category-and-tag/category')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    try {
      const data = await this.blogService.createCategory(createCategoryDto);
      return { data: data.raw[0] };
    } catch (error) {
      return error;
    }
  }

  @Patch('/category-and-tag/category')
  async updateCategory(
    @Body(UpdateCategoryPipe) updateCategoryDto: UpdateCategoryDto,
  ) {
    await this.blogService.updateCategory(updateCategoryDto);
    return { data: updateCategoryDto };
  }

  @Delete('/category-and-tag/category')
  async deleteCategory(@Body('id', ParseIntPipe) id: number) {
    await this.blogService.deleteCategoryById(id);
    return { data: { id } };
  }

  // TAG
  @Post('category-and-tag/tag')
  async createTag(@Body() createTagDto: CreateTagDto) {
    try {
      const data = await this.blogService.createTag(createTagDto);
      return { data: data.raw[0] };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  @Patch('/category-and-tag/tag')
  async updateTag(@Body(UpdateTagPipe) updateTagDto: UpdateTagDto) {
    await this.blogService.updateTag(updateTagDto);
    return { data: updateTagDto };
  }

  @Delete('/category-and-tag/tag')
  async deleteTag(@Body('id', ParseIntPipe) id: number) {
    await this.blogService.deleteTagById(id);
    return { data: { id } };
  }
}
