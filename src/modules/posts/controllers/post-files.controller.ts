import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostFileService } from '../services/post-file.service';
import {
  PostFileUploadDto,
  PostFileAttachmentDto,
  BulkFileAssociationDto,
  PostFileQueryDto,
  PostFileStatsDto,
} from '../dto/post-file.dto';

@Controller('posts/:postId/files')
export class PostFilesController {
  constructor(private readonly postFileService: PostFileService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadFiles(
    @Param('postId', ParseUUIDPipe) postId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
    @Body() dto: Omit<PostFileUploadDto, 'postId'>,
    @Request() req,
  ) {
    const uploadDto: PostFileUploadDto = { ...dto, postId };
    return this.postFileService.uploadPostFiles(files, uploadDto, req.user.id);
  }

  @Post('associate')
  async associateFiles(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: Omit<BulkFileAssociationDto, 'postId'>,
    @Request() req,
  ) {
    return this.postFileService.associateFilesWithPost(
      dto.fileIds,
      postId,
      req.user.id,
    );
  }

  @Get()
  async getAttachments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() query: PostFileQueryDto,
    @Request() req,
  ) {
    return this.postFileService.getPostAttachments(postId, req.user.id);
  }

  @Get('stats')
  async getFileStats(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Request() req,
  ) {
    return this.postFileService.getPostFileStatistics(postId, req.user.id);
  }

  @Get(':fileId/download')
  async downloadFile(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Request() req,
  ) {
    return this.postFileService.downloadPostAttachment(fileId, req.user.id);
  }

  @Delete('remove')
  async removeAttachments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: Omit<PostFileAttachmentDto, 'postId'>,
    @Request() req,
  ) {
    const attachmentDto: PostFileAttachmentDto = { ...dto, postId };
    return this.postFileService.removePostAttachments(attachmentDto, req.user.id);
  }

  @Delete(':fileId')
  async removeSpecificFile(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Request() req,
  ) {
    const attachmentDto: PostFileAttachmentDto = {
      postId,
      fileIds: [fileId],
    };
    return this.postFileService.removePostAttachments(attachmentDto, req.user.id);
  }
}
