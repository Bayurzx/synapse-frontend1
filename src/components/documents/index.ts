/**
 * Document Center Components
 * 
 * Components for the Synapse Document Center UI including:
 * - TemplateGallery: Display and select document templates
 * - DocumentWizard: Step-by-step document generation
 * - DocumentPreview: HTML/PDF document viewer
 * - SignatureStatus: DocuSign signature status display
 * - DocumentHistory: Document activity timeline
 */

export { TemplateGallery } from './TemplateGallery';
export type { Template } from './TemplateGallery';

export { DocumentWizard } from './DocumentWizard';

export { DocumentPreview, SimpleDocumentPreview } from './DocumentPreview';

export { SignatureStatus } from './SignatureStatus';
export type { SignatureStatusType } from './SignatureStatus';

export { DocumentHistory, generateSampleHistory } from './DocumentHistory';
export type { HistoryEvent } from './DocumentHistory';
