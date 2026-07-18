import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import { DocumentApplicationService } from '../../application/services/document-application.service';
import { DeviceInfo } from '../../application/services/auth-application.service';
import {
  CreateDocumentDto,
  ConfirmUploadDto,
  PaginationQueryDto,
} from '../../application/dto';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('profiles/:profileId/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentApplicationService) {}

  private toDeviceInfo(ip: string, userAgent: string): DeviceInfo {
    return { ipAddress: ip, userAgent };
  }

  @Post('presigned-upload')
  @HttpCode(HttpStatus.CREATED)
  requestPresignedUpload(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Body() dto: CreateDocumentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.documentService.requestPresignedUpload(
      userId,
      profileId,
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Get()
  listDocuments(
    @CurrentUser('userId') userId: string,
    @Param('profileId') profileId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.documentService.listDocuments(userId, profileId, query);
  }
}

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('documents')
export class DocumentDetailController {
  constructor(private readonly documentService: DocumentApplicationService) {}

  private toDeviceInfo(ip: string, userAgent: string): DeviceInfo {
    return { ipAddress: ip, userAgent };
  }

  @Post(':id/confirm-upload')
  @HttpCode(HttpStatus.OK)
  confirmUpload(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmUploadDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.documentService.confirmUpload(
      userId,
      id,
      dto,
      this.toDeviceInfo(ip, userAgent),
    );
  }

  @Get(':id')
  getDocument(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.documentService.getDocument(userId, id);
  }

  @Get(':id/download')
  getDownloadUrl(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Query('variant') variant?: string,
  ) {
    return this.documentService.getDownloadUrl(
      userId,
      id,
      variant as 'original' | 'converted' | 'thumbnail' | undefined,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDocument(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.documentService.deleteDocument(
      userId,
      id,
      this.toDeviceInfo(ip, userAgent),
    );
  }
}
