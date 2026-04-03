import { z } from "zod";

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const chatMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().max(10000, "Message content too long (max 10,000 characters)"),
  imageData: z.string().max(10_000_000, "Image data too large").optional(),
  imageMimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_MIME_TYPES.join(", ")}`,
  }).optional(),
  hasPlan: z.boolean().optional(),
  planData: z.string().max(500_000, "Plan data too large").optional(),
});

export const generateRequestSchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .min(1, "At least one message is required")
    .max(50, "Too many messages in conversation"),
  userId: z.string().min(1, "userId is required").max(128),
  experienceLevel: z.enum(["Beginner", "Intermediate", "Advanced"], {
    error: "experienceLevel must be Beginner, Intermediate, or Advanced",
  }),
  designStyle: z.string().min(1, "designStyle is required").max(100),
});

export const generateImageRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(2000, "Prompt too long (max 2,000 characters)"),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>;
