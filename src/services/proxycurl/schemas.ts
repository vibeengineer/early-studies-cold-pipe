import { z } from "zod";

const DateSchema = z
  .object({
    day: z.number(),
    month: z.number(),
    year: z.number(),
  })
  .nullable();

const ProjectSchema = z.object({
  description: z.string().nullable(),
  ends_at: DateSchema,
  starts_at: DateSchema,
  title: z.string().nullable(),
  url: z.string().url().nullable(),
});

const ActivitySchema = z.object({
  activity_status: z.string().nullable(),
  link: z.string().url().nullable(),
  title: z.string().nullable(),
});

const CertificationSchema = z.object({
  authority: z.string().nullable(),
  display_source: z.string().nullable(),
  ends_at: DateSchema,
  license_number: z.string().nullable(),
  name: z.string().nullable(),
  starts_at: DateSchema,
  url: z.string().url().nullable(),
});

const EducationSchema = z.object({
  activities_and_societies: z.string().nullable(),
  degree_name: z.string().nullable(),
  description: z.string().nullable(),
  ends_at: DateSchema,
  field_of_study: z.string().nullable(),
  grade: z.string().nullable(),
  logo_url: z.string().url().nullable(),
  school: z.string().nullable(),
  school_facebook_profile_url: z.string().url().nullable(),
  school_linkedin_profile_url: z.string().url().nullable(),
  starts_at: DateSchema,
});

const ExperienceSchema = z.object({
  company: z.string().nullable(),
  company_facebook_profile_url: z.string().url().nullable(),
  company_linkedin_profile_url: z.string().url().nullable(),
  description: z.string().nullable(),
  ends_at: DateSchema,
  location: z.string().nullable(),
  logo_url: z.string().url().nullable(),
  starts_at: DateSchema,
  title: z.string().nullable(),
});

const SimilarlyNamedProfileSchema = z.object({
  link: z.string().url().nullable(),
  location: z.string().nullable(),
  name: z.string().nullable(),
  summary: z.string().nullable(),
});

const AccomplishmentOrgSchema = z.object({
  starts_at: DateSchema,
  ends_at: DateSchema,
  org_name: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
});

const PublicationSchema = z.object({
  name: z.string().nullable(),
  publisher: z.string().nullable(),
  published_on: DateSchema,
  description: z.string().nullable(),
  url: z.string().url().nullable(),
});

const HonourAwardSchema = z.object({
  title: z.string().nullable(),
  issuer: z.string().nullable(),
  issued_on: DateSchema,
  description: z.string().nullable(),
});

const PatentSchema = z.object({
  title: z.string().nullable(),
  issuer: z.string().nullable(),
  issued_on: DateSchema,
  description: z.string().nullable(),
  application_number: z.string().nullable(),
  patent_number: z.string().nullable(),
  url: z.string().url().nullable(),
});

const CourseSchema = z.object({
  name: z.string().nullable(),
  number: z.string().nullable(),
});

const TestScoreSchema = z.object({
  name: z.string().nullable(),
  score: z.string().nullable(),
  date_on: DateSchema,
  description: z.string().nullable(),
});

const VolunteeringExperienceSchema = z.object({
  starts_at: DateSchema,
  ends_at: DateSchema,
  title: z.string().nullable(),
  cause: z.string().nullable(),
  company: z.string().nullable(),
  company_linkedin_profile_url: z.string().url().nullable(),
  description: z.string().nullable(),
  logo_url: z.string().url().nullable(),
});

const PeopleAlsoViewedSchema = z.object({
  link: z.string().url().nullable(),
  name: z.string().nullable(),
  summary: z.string().nullable(),
  location: z.string().nullable(),
});

const ArticleSchema = z.object({
  title: z.string().nullable(),
  link: z.string().url().nullable(),
  published_date: DateSchema,
  author: z.string().nullable(),
  image_url: z.string().url().nullable(),
});

const PersonGroupSchema = z.object({
  profile_pic_url: z.string().url().nullable(),
  name: z.string().nullable(),
  url: z.string().url().nullable(),
});

const InferredSalarySchema = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});

const PersonExtraSchema = z.object({
  github_profile_id: z.string().nullable(),
  facebook_profile_id: z.string().nullable(),
  twitter_profile_id: z.string().nullable(),
  website: z.string().url().nullable(),
});

const LanguageSchema = z.object({
  name: z.string(),
  proficiency: z
    .enum([
      "ELEMENTARY",
      "LIMITED_WORKING",
      "PROFESSIONAL_WORKING",
      "FULL_PROFESSIONAL",
      "NATIVE_OR_BILINGUAL",
    ])
    .nullable(),
});

const PersonProfileSchema = z.object({
  accomplishment_courses: z.array(CourseSchema).default([]),
  accomplishment_honors_awards: z.array(HonourAwardSchema).default([]),
  accomplishment_organisations: z.array(AccomplishmentOrgSchema).default([]),
  accomplishment_patents: z.array(PatentSchema).default([]),
  accomplishment_projects: z.array(ProjectSchema).default([]),
  accomplishment_publications: z.array(PublicationSchema).default([]),
  accomplishment_test_scores: z.array(TestScoreSchema).default([]),
  activities: z.array(ActivitySchema).default([]),
  articles: z.array(ArticleSchema).default([]),
  background_cover_image_url: z.string().url().nullable(),
  certifications: z.array(CertificationSchema).default([]),
  city: z.string().nullable(),
  connections: z.number().nullable(),
  country: z.string().nullable(),
  country_full_name: z.string().nullable(),
  education: z.array(EducationSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  first_name: z.string().nullable(),
  follower_count: z.number().nullable(),
  full_name: z.string().nullable(),
  groups: z.array(PersonGroupSchema).default([]),
  headline: z.string().nullable(),
  last_name: z.string().nullable(),
  occupation: z.string().nullable(),
  people_also_viewed: z.array(PeopleAlsoViewedSchema).default([]),
  profile_pic_url: z.string().url().nullable(),
  public_identifier: z.string().nullable(),
  recommendations: z.array(z.string()).default([]),
  similarly_named_profiles: z.array(SimilarlyNamedProfileSchema).default([]),
  state: z.string().nullable(),
  summary: z.string().nullable(),
  volunteer_work: z.array(VolunteeringExperienceSchema).default([]),
  languages_and_proficiencies: z.array(LanguageSchema).optional(),
  inferred_salary: InferredSalarySchema.nullable().optional(),
  gender: z.string().nullable().optional(),
  birth_date: DateSchema.optional(),
  industry: z.string().nullable().optional(),
  extra: PersonExtraSchema.nullable().optional(),
  interests: z.array(z.string()).optional(),
  personal_emails: z.array(z.string().email()).optional(),
  personal_numbers: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

export default PersonProfileSchema;

export type LinkedinProfile = z.infer<typeof PersonProfileSchema>;
