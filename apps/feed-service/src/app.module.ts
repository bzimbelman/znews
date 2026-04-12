import { Module } from "@nestjs/common";
import { FeedService } from "./feed/feed.service";
import { ArticlesService } from "./articles/articles.service";
import { SourcesService } from "./sources/sources.service";
import { UsersService } from "./users/users.service";
import { AuthService } from "./auth/auth.service";

@Module({
  imports: [],
  controllers: [],
  providers: [
    FeedService,
    ArticlesService,
    SourcesService,
    UsersService,
    AuthService,
  ],
})
export class AppModule {}
