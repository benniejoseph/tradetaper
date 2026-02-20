import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { CommunityService } from './community.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { UpdateCommunitySettingsDto } from './dto/update-community-settings.dto';
import { CreateCommunityReplyDto } from './dto/create-community-reply.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('feed')
  getFeed(@Query() query) {
    return this.communityService.getFeed(query);
  }

  @Get('leaderboard')
  getLeaderboard(@Query() query) {
    return this.communityService.getLeaderboard(query);
  }

  @Get('people')
  getPeople(@Query() query) {
    return this.communityService.getPeople(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/search')
  searchUsers(@Query('query') query: string) {
    return this.communityService.searchUsers(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@Request() req) {
    return this.communityService.getSettings(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('settings')
  updateSettings(@Request() req, @Body() dto: UpdateCommunitySettingsDto) {
    return this.communityService.updateSettings(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  createPost(@Request() req, @Body() dto: CreateCommunityPostDto) {
    return this.communityService.createPost(req.user.id, dto);
  }

  @Get('posts/:postId/replies')
  getReplies(@Param('postId') postId: string, @Query() query) {
    return this.communityService.getReplies(postId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('posts/:postId/replies')
  createReply(
    @Request() req,
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityReplyDto,
  ) {
    return this.communityService.createReply(req.user.id, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/:userId')
  follow(@Request() req, @Param('userId') userId: string) {
    return this.communityService.followUser(req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow/:userId')
  unfollow(@Request() req, @Param('userId') userId: string) {
    return this.communityService.unfollowUser(req.user.id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('following')
  getFollowing(@Request() req) {
    return this.communityService.getFollowing(req.user.id);
  }
}
