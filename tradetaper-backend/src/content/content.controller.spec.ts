/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { ContentController } from './content.controller';
import { Response } from 'express';
import { createReadStream, promises as fsPromises } from 'fs';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';

// Mock the 'fs' module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    access: jest.fn(),
  },
  createReadStream: jest.fn(),
}));

describe('ContentController', () => {
  let controller: ContentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
    }).compile();

    controller = module.get<ContentController>(ContentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLegalDocument', () => {
    it('should serve a legal document successfully', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        pipe: jest.fn(),
      } as unknown as Response;

      const mockStream = { pipe: jest.fn() };
      (fsPromises.access as jest.Mock).mockResolvedValue(undefined);
      (createReadStream as jest.Mock).mockReturnValue(mockStream);

      await controller.getLegalDocument('privacy', mockResponse);

      expect(fsPromises.access).toHaveBeenCalledWith(
        path.join(__dirname, '..', '..', 'content', 'legal', 'PRIVACY_POLICY.md'),
        expect.any(Number),
      );
      expect(createReadStream).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/markdown; charset=utf-8',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=3600',
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(mockResponse);
    });

    it('should throw a NOT_FOUND exception for an invalid document key', async () => {
      const mockResponse = {} as Response;
      await expect(
        controller.getLegalDocument('non-existent-doc', mockResponse),
      ).rejects.toThrow(
        new HttpException('Document not found', HttpStatus.NOT_FOUND),
      );
    });
  });
}); 