import { Response } from 'express';
export declare class ContentController {
    private readonly contentPath;
    getProductDescription(res: Response): Promise<void>;
    getTermsOfService(res: Response): Promise<void>;
    getPrivacyPolicy(res: Response): Promise<void>;
    getCancellationRefundPolicy(res: Response): Promise<void>;
    getSupportGuide(res: Response): Promise<void>;
    getContentIndex(res: Response): Promise<void>;
    getLegalDocument(document: string, res: Response): Promise<void>;
    private serveContent;
}
