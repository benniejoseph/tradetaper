import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
// import { Note } from './note.entity'; // Commented to avoid circular import

@Entity('note_media')
export class NoteMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'note_id' })
  @Index()
  noteId: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'original_name', length: 255 })
  originalName: string;

  @Column({ name: 'file_type', length: 100 })
  @Index()
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'gcs_path', length: 500 })
  gcsPath: string;

  @Column({ name: 'thumbnail_path', length: 500, nullable: true })
  thumbnailPath?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationship commented to avoid circular import
  // @ManyToOne(() => Note, (note) => note.media, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'note_id' })
  // note: Note;

  // Computed properties
  get isImage(): boolean {
    return this.fileType.startsWith('image/');
  }

  get isVideo(): boolean {
    return this.fileType.startsWith('video/');
  }

  get isAudio(): boolean {
    return this.fileType.startsWith('audio/');
  }

  get isPdf(): boolean {
    return this.fileType === 'application/pdf';
  }

  get humanFileSize(): string {
    const bytes = Number(this.fileSize);
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Virtual properties for URL generation
  get signedUrl(): string | null {
    // This would be populated by the service when needed
    return null;
  }

  get thumbnailSignedUrl(): string | null {
    // This would be populated by the service when needed
    return null;
  }
}
