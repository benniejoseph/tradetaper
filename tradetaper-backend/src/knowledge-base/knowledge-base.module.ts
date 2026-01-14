import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeDocument } from './entities/knowledge-document.entity';
import { VectorEmbedding } from './entities/vector-embedding.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeDocument, VectorEmbedding]),
    ConfigModule,
  ],
  providers: [KnowledgeBaseService],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
