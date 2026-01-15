/**
 * Services Module
 * 
 * Barrel export for all service classes.
 * Services encapsulate API interactions and business logic.
 * 
 * @module services
 */

// ─── AI Search Service ────────────────────────────────────────────────────────
export {
	AISearchService,
	getAISearchService,
	resetAISearchService,
	type AISearchRequest,
	type AISearchResponse,
	type AISearchStreamCallbacks,
	type AISearchConfig,
} from './AISearchService';

// ─── Contact Form Service ─────────────────────────────────────────────────────
export {
	ContactFormService,
	getContactFormService,
	resetContactFormService,
	validateContactForm,
	ContactFormSchema,
	type ContactFormData,
	type ContactFormResponse,
	type ContactFormConfig,
	type ValidationErrors,
} from './ContactFormService';
