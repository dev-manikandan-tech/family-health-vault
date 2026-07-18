import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FamilyApplicationService } from '../../application/services/family-application.service';
import { CurrentUser } from '../../infrastructure/security/current-user.decorator';
import { SupabaseAuthGuard } from '../../infrastructure/security/supabase-auth.guard';
import {
  AcceptInvitationDto,
  CreateFamilyDto,
  FamilyInvitationResponseDto,
  FamilyMemberResponseDto,
  FamilyResponseDto,
  InviteMemberDto,
  PaginationQueryDto,
  UpdateFamilyDto,
  UpdateMemberRoleDto,
} from '../../application/dto';

@ApiTags('Families')
@Controller('families')
@UseGuards(SupabaseAuthGuard)
export class FamilyController {
  constructor(private readonly familyService: FamilyApplicationService) {}

  @ApiBearerAuth()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFamily(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateFamilyDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<FamilyResponseDto> {
    return this.familyService.createFamily(userId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Get()
  async listFamilies(
    @CurrentUser('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: FamilyResponseDto[]; total: number }> {
    return this.familyService.listFamilies(userId, query);
  }

  @ApiBearerAuth()
  @Get(':id')
  async getFamily(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
  ): Promise<FamilyResponseDto> {
    return this.familyService.getFamily(userId, familyId);
  }

  @ApiBearerAuth()
  @Patch(':id')
  async updateFamily(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Body() dto: UpdateFamilyDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<FamilyResponseDto> {
    return this.familyService.updateFamily(userId, familyId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFamily(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return this.familyService.deleteFamily(userId, familyId, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Post(':id/invite')
  @HttpCode(HttpStatus.CREATED)
  async inviteMember(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Body() dto: InviteMemberDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<FamilyInvitationResponseDto> {
    return this.familyService.inviteMember(userId, familyId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Post('invitations/accept')
  async acceptInvitation(
    @CurrentUser('userId') userId: string,
    @Body() dto: AcceptInvitationDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<FamilyMemberResponseDto> {
    return this.familyService.acceptInvitation(userId, dto, {
      ipAddress: ip,
      userAgent,
    });
  }

  @ApiBearerAuth()
  @Get(':id/members')
  async listMembers(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<{ data: FamilyMemberResponseDto[]; total: number }> {
    return this.familyService.listMembers(userId, familyId, query);
  }

  @ApiBearerAuth()
  @Patch(':id/members/:memberId')
  async updateMemberRole(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<FamilyMemberResponseDto> {
    return this.familyService.updateMemberRole(
      userId,
      familyId,
      memberId,
      dto,
      {
        ipAddress: ip,
        userAgent,
      },
    );
  }

  @ApiBearerAuth()
  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(
    @CurrentUser('userId') userId: string,
    @Param('id') familyId: string,
    @Param('memberId') memberId: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return this.familyService.removeMember(userId, familyId, memberId, {
      ipAddress: ip,
      userAgent,
    });
  }
}
