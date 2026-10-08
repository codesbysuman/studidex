// lib/core/types.ts

export type ID = string;

export type ISODate = string;
export type ISODateTime = string;

export type SubjectId = ID;
export type InputId = ID;
export type ItemId = ID;
export type MaterialId = ID;
export type TopicId = ID;

export type SourceType =
    | "whatsapp"
    | "college"
    | "department"
    | "teacher"
    | "university"
    | "school"
    | "board"
    | "user"
    | "web"
    | "library"
    | "other";

export type InputType =
    | "text"
    | "message"
    | "image"
    | "pdf"
    | "document"
    | "file"
    | "link";

export type ItemType =
    | "event"
    | "action"
    | "update"
    | "opportunity";

export type EventType =
    | "class"
    | "exam"
    | "test"
    | "deadline"
    | "holiday"
    | "submission"
    | "meeting"
    | "other";

export type ActionType =
    | "assignment"
    | "study"
    | "submission"
    | "application"
    | "preparation"
    | "practice"
    | "other";

export type UpdateType =
    | "notice"
    | "change"
    | "announcement"
    | "information"
    | "other";

export type OpportunityType =
    | "scholarship"
    | "competition"
    | "internship"
    | "fellowship"
    | "admission"
    | "other";

export type MaterialType =
    | "note"
    | "pdf"
    | "document"
    | "syllabus"
    | "pyq"
    | "mock_test"
    | "sample_paper"
    | "handout"
    | "reference"
    | "link"
    | "image"
    | "other";

export type MaterialOrigin =
    | "personal"
    | "college"
    | "teacher"
    | "library"
    | "community"
    | "web"
    | "system";

export type Priority =
    | "low"
    | "normal"
    | "high"
    | "urgent";

export type Status =
    | "active"
    | "completed"
    | "cancelled"
    | "archived";

export type Visibility =
    | "private"
    | "shared"
    | "public";