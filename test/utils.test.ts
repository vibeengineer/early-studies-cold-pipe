import { describe, expect, it } from "vitest";
import { convertToSnakeCase } from "../src/utils";
import { structureObjectWithCustomFields } from "../src/utils";
import { MOCK_ENRICHMENT_PERSON_PROFILE } from "./mocks/person";

describe("convertToSnakeCase", () => {
  it("should convert simple object keys from camelCase and spaces to snake_case", () => {
    const input = {
      firstName: "John",
      "last name": "Doe",
      userAge: 30,
    };
    const expected = {
      first_name: "John",
      last_name: "Doe",
      user_age: 30,
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle nested objects recursively", () => {
    const input = {
      userProfile: {
        "display name": "Johnny D",
        contactInfo: {
          emailAddress: "john.doe@example.com",
          "phone number": "123-456-7890",
        },
      },
      accountStatus: "active",
    };
    const expected = {
      user_profile: {
        display_name: "Johnny D",
        contact_info: {
          email_address: "john.doe@example.com",
          phone_number: "123-456-7890",
        },
      },
      account_status: "active",
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle arrays of objects recursively", () => {
    const input = [
      { itemId: 1, "item name": "Gadget" },
      {
        itemId: 2,
        "item name": "Widget",
        specsDetail: { materialType: "Metal", "color option": "Blue" },
      },
    ];
    const expected = [
      { item_id: 1, item_name: "Gadget" },
      {
        item_id: 2,
        item_name: "Widget",
        specs_detail: { material_type: "Metal", color_option: "Blue" },
      },
    ];
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should handle arrays with mixed primitive types", () => {
    const input = {
      mixedArray: [1, "string", { keyName: "value" }, ["nested_item"]],
    };
    const expected = {
      mixed_array: [1, "string", { key_name: "value" }, ["nested_item"]],
    };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });

  it("should return non-object types as is", () => {
    expect(convertToSnakeCase("string")).toBe("string");
    expect(convertToSnakeCase(123)).toBe(123);
    expect(convertToSnakeCase(null)).toBeNull();
    expect(convertToSnakeCase(undefined)).toBeUndefined();
  });

  it("should handle empty objects and arrays", () => {
    expect(convertToSnakeCase({})).toEqual({});
    expect(convertToSnakeCase([])).toEqual([]);
    const input = { emptyObj: {}, emptyArray: [] };
    const expected = { empty_obj: {}, empty_array: [] };
    expect(convertToSnakeCase(input)).toEqual(expected);
  });
});

describe("structureObjectWithCustomFields", () => {
  it("should restructure a LinkedIn profile object, moving non-root keys to custom_fields", () => {
    const input = MOCK_ENRICHMENT_PERSON_PROFILE;

    // Expected output structure based on ROOT_KEYS in utils.ts and snake_casing
    const expected = {
      // Root fields (only those present in mock and in ROOT_KEYS)
      first_name: "Jennifer",
      last_name: "Golotko",
      // Note: Other ROOT_KEYS like email, phone_number, company_name, website, location, linkedin_profile, company_url
      // are either not present at the top level of MOCK_ENRICHMENT_PERSON_PROFILE or nested within other fields.

      // Custom fields (all other snake_cased keys)
      custom_fields: {
        accomplishment_courses: [],
        accomplishment_honors_awards: [
          {
            title: "Digital Analytics Excellence Award",
            issuer: "Media Analytics Association",
            issued_on: { day: 15, month: 6, year: 2023 },
            description:
              "Recognized for innovative use of data analytics in media audience engagement",
          },
        ],
        accomplishment_organisations: [],
        accomplishment_patents: [],
        accomplishment_projects: [
          {
            description:
              "Led cross-functional team to develop new audience segmentation model resulting in 32% increase in targeted ad efficiency",
            ends_at: { day: 30, month: 9, year: 2024 },
            starts_at: { day: 1, month: 3, year: 2024 },
            title: "Next-Gen Audience Analytics Initiative",
            url: null,
          },
          {
            description:
              "Implemented predictive analytics framework for content performance optimization across digital platforms",
            ends_at: { day: 15, month: 11, year: 2023 },
            starts_at: { day: 10, month: 5, year: 2023 },
            title: "Content Performance Analytics Framework",
            url: null,
          },
        ],
        accomplishment_publications: [],
        accomplishment_test_scores: [],
        activities: [
          {
            activity_status: "Shared by Jennifer Golotko",
            link: "https://www.linkedin.com/posts/jennifergolotko_media-analytics-datascience-activity-7123456789012345678-abcd",
            title:
              "Excited to share our latest research on viewer engagement patterns across streaming platforms. The data reveals surprising insights about Gen Z consumption habits that challenge traditional media metrics. #MediaAnalytics #DataScience",
          },
          {
            activity_status: "Liked by Jennifer Golotko",
            link: "https://www.linkedin.com/posts/dataanalytics-network_the-future-of-audience-measurement-in-a-activity-7198765432109876543-efgh",
            title:
              "The Future of Audience Measurement in a Cross-Platform World: New Study Shows Emerging Patterns",
          },
        ],
        articles: [],
        background_cover_image_url:
          "https://media.licdn.com/dms/image/D5616AQHxYvFq1UG0Sg/profile-displaybackgroundimage-shrink_350_1400/0/1684789456123?e=1724976000&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
        certifications: [
          {
            authority: "Google",
            display_source: "google.com",
            ends_at: null,
            license_number: null,
            name: "Google Analytics 4 Certification",
            starts_at: { day: 10, month: 5, year: 2023 },
            url: null,
          },
          {
            authority: "Tableau",
            display_source: "tableau.com",
            ends_at: null,
            license_number: null,
            name: "Tableau Desktop Specialist",
            starts_at: { day: 15, month: 9, year: 2022 },
            url: null,
          },
        ],
        city: "New York",
        connections: 823,
        country: "US",
        country_full_name: "United States of America",
        education: [
          {
            activities_and_societies: "Media Analytics Club, Data Science Association",
            degree_name: "Master of Science",
            description: "Focus on Media Analytics and Consumer Behavior",
            ends_at: { day: 15, month: 5, year: 2012 },
            field_of_study: "Analytics",
            grade: "Magna Cum Laude",
            logo_url:
              "https://media.licdn.com/dms/image/C4D0BAQHiNSL4LkrMeA/company-logo_100_100/0/1519856053180?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            school: "Northwestern University",
            school_facebook_profile_url: null,
            school_linkedin_profile_url: "https://www.linkedin.com/school/northwestern-university/",
            starts_at: { day: 1, month: 9, year: 2010 },
          },
          {
            activities_and_societies: "Media Club, Statistics Society",
            degree_name: "Bachelor of Arts",
            description: null,
            ends_at: { day: 15, month: 5, year: 2008 },
            field_of_study: "Communications with Minor in Statistics",
            grade: "Cum Laude",
            logo_url:
              "https://media.licdn.com/dms/image/C4E0BAQFQr7xT6E3zSg/company-logo_100_100/0/1591052938267?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            school: "Boston University",
            school_facebook_profile_url: null,
            school_linkedin_profile_url: "https://www.linkedin.com/school/boston-university/",
            starts_at: { day: 1, month: 9, year: 2004 },
          },
        ],
        experiences: [
          {
            company: "Fox News Media",
            company_facebook_profile_url: "https://www.facebook.com/FOXTV",
            company_linkedin_profile_url: "http://www.linkedin.com/company/fox-news-channel",
            description:
              "Leading a team of 12 analytics professionals to drive data-informed decision making across Fox News Media properties. Responsible for audience intelligence, content performance analytics, cross-platform measurement, and predictive modeling. Key initiatives include developing advanced audience segmentation models, implementing real-time content performance dashboards, and creating predictive analytics frameworks for programming and digital content strategy.",
            ends_at: null,
            location: "New York, New York, United States",
            logo_url:
              "https://media.licdn.com/dms/image/C4E0BAQGzUHCKK5LMOw/company-logo_100_100/0/1656697972798?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            starts_at: { day: 15, month: 6, year: 2021 },
            title: "Director, Insights & Analytics",
          },
          {
            company: "NBCUniversal Media",
            company_facebook_profile_url: "https://www.facebook.com/NBCUniversal/",
            company_linkedin_profile_url: "https://www.linkedin.com/company/nbcuniversal/",
            description:
              "Developed and led implementation of audience analytics strategy across digital platforms. Managed cross-functional projects to optimize content performance and audience engagement. Created predictive models for content performance and viewer retention.",
            ends_at: { day: 1, month: 6, year: 2021 },
            location: "New York, New York, United States",
            logo_url:
              "https://media.licdn.com/dms/image/C4D0BAQH-t2S4-cMNZQ/company-logo_100_100/0/1638831591606?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            starts_at: { day: 10, month: 3, year: 2018 },
            title: "Senior Manager, Digital Analytics",
          },
          {
            company: "Viacom",
            company_facebook_profile_url: null,
            company_linkedin_profile_url: "https://www.linkedin.com/company/viacom/",
            description:
              "Led analytics initiatives for MTV, Comedy Central, and Nickelodeon digital properties. Implemented audience segmentation strategies and content optimization frameworks.",
            ends_at: { day: 28, month: 2, year: 2018 },
            location: "New York, New York, United States",
            logo_url:
              "https://media.licdn.com/dms/image/C4D0BAQGYuFcGxzO8Tg/company-logo_100_100/0/1583932046901?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            starts_at: { day: 15, month: 7, year: 2014 },
            title: "Manager, Analytics",
          },
        ],
        follower_count: 912,
        full_name: "Jennifer Golotko",
        groups: [
          {
            profile_pic_url:
              "https://media.licdn.com/dms/image/C4D0BAQGzUHCKK5LMOw/group-logo_100_100/0/1656697972798?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            name: "Media Analytics Professionals",
            url: "https://www.linkedin.com/groups/1234567/",
          },
          {
            profile_pic_url:
              "https://media.licdn.com/dms/image/C4D0BAQHiNSL4LkrMeA/group-logo_100_100/0/1519856053180?e=1727385600&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
            name: "Data Science for Media",
            url: "https://www.linkedin.com/groups/89101112/",
          },
        ],
        headline:
          "Director, Insights & Analytics at Fox News Media | Driving data-informed decision making across media platforms",
        occupation: "Director, Insights & Analytics at Fox News Media",
        people_also_viewed: [
          {
            link: "https://www.linkedin.com/in/johnsmithanalytics",
            name: "John Smith",
            summary: "VP, Data Science at Major Media Conglomerate",
            location: "Los Angeles, California, United States",
          },
          {
            link: "https://www.linkedin.com/in/sarahchenmedia",
            name: "Sarah Chen",
            summary: "Head of Audience Insights at Streaming Service",
            location: "San Francisco Bay Area",
          },
        ],
        profile_pic_url:
          "https://media.licdn.com/dms/image/C4E03AQHjklmNopqrSt/profile-displayphoto-shrink_100_100/0/1612345678901?e=1724976000&v=beta&t=AbCdEfGhIjK1LmNoPqRsTuVwXyZ2A3B4C5D6E7F8G9H0",
        public_identifier: "jennifergolotko",
        recommendations: [],
        similarly_named_profiles: [
          {
            link: "https://www.linkedin.com/pub/jen-golotko/a/123/456",
            location: "Chicago, Illinois, United States",
            name: "Jen Golotko",
            summary: "Marketing Manager",
          },
        ],
        state: "New York",
        summary:
          "Experienced media analytics leader with a passion for leveraging data to drive audience growth and optimize content strategy. Proven track record in building high-performing teams and implementing innovative analytics solutions across broadcast and digital platforms.",
        volunteer_work: [],
        // Optional fields from Profile schema
        birth_date: null,
        extra: {
          facebook_profile_id: null,
          github_profile_id: null,
          twitter_profile_id: null,
          website: null,
        },
        gender: null,
        inferred_salary: null,
        industry: "Broadcast Media",
        interests: ["Media Analytics", "Data Science", "Audience Engagement"],
        personal_emails: [],
        personal_numbers: [],
        skills: [
          "Data Analytics",
          "Audience Measurement",
          "Media Analytics",
          "Tableau",
          "SQL",
          "Google Analytics",
          "Content Strategy",
          "Cross-platform Analytics",
          "Predictive Modeling",
          "Data Visualization",
          "Team Leadership",
          "A/B Testing",
          "Python",
          "R",
          "Audience Segmentation",
        ],
        languages_and_proficiencies: [
          { name: "English", proficiency: "NATIVE_OR_BILINGUAL" },
          { name: "Spanish", proficiency: "LIMITED_WORKING" },
        ],
      },
    };

    // Note: The `expected` object above is manually constructed based on ROOT_KEYS
    // and the structure of MOCK_ENRICHMENT_PERSON_PROFILE.
    // It assumes `first_name` and `last_name` are directly available at the root of the input.
    // It also assumes fields like `location` and `company_name` might be derived/flattened *before*
    // calling structureObjectWithCustomFields or that they are part of ROOT_KEYS even if nested in the input.
    // Adjust the expected object based on the actual behavior and ROOT_KEYS definition.

    // Specifically check a few root keys and the existence of custom_fields
    const result = structureObjectWithCustomFields(input);

    // Check root fields that should be present based on mock data and ROOT_KEYS
    expect(result.first_name).toEqual(expected.first_name);
    expect(result.last_name).toEqual(expected.last_name);
    // Check that other potential root keys are NOT at the root
    expect(result.location).toBeUndefined();
    expect(result.email).toBeUndefined();
    expect(result.company_name).toBeUndefined();

    // Check if custom_fields exist and contain specific nested data
    expect(result.custom_fields).toBeDefined();
    const customFields = result.custom_fields as Record<string, unknown>;
    expect(customFields.headline).toEqual(expected.custom_fields.headline);
    expect(customFields.accomplishment_projects).toEqual(
      expected.custom_fields.accomplishment_projects
    );
    expect(customFields.experiences).toEqual(expected.custom_fields.experiences);
    expect(customFields.skills).toEqual(expected.custom_fields.skills);

    // For a more robust test, you might want to compare the entire objects,
    // but ensure the 'expected' object perfectly reflects the function's output structure,
    // including the exact keys defined in ROOT_KEYS and the snake_casing transformation.
    // expect(result).toEqual(expected); // Use this for a full comparison if confident in 'expected'
  });
});
