export type CvEducation = {
  id: string;
  school_name: string;
  degree?: string;
  major?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type CvExperience = {
  id: string;
  job_title: string;
  company: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type CvSkill = {
  id: string;
  name: string;
  level?: string;
};

export type CvLanguage = {
  id: string;
  name: string;
  proficiency?: string;
};

export type CvLeadership = {
  id: string;
  role: string;
  organization: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type CvActivity = {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
};

export type CvInterest = {
  id: string;
  description: string;
};

// Formal Office Template specific types
export type CvFormalEducation = {
  id: string;
  level: string;
  school: string;
  commence: string;
  completed: string;
};

export type CvNonformalEducation = {
  id: string;
  level: string;
  school: string;
  commence: string;
  completed: string;
};

export type CvEmploymentHistory = {
  id: string;
  company: string;
  type: string;
  position: string;
  from_date: string;
  to_date: string;
  contact_reference: string;
};

export type CvAchievement = {
  id: string;
  company: string;
  type: string;
  position: string;
  from_date: string;
  to_date: string;
};

export type CvTravelHistory = {
  id: string;
  country: string;
  purpose: string;
  start_date: string;
  end_date: string;
};

export type CvNextOfKin = {
  name: string;
  relationship: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  contact_no?: string;
  email?: string;
};

export type CvTemplateId = 1 | 7 | "formal";

export type CvData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  job_title?: string;
  photo_url?: string;
  profile_description?: string;
  template_id: CvTemplateId;

  // Personal details (Formal Office Template)
  province_state?: string;
  postal_code?: string;
  country?: string;
  date_of_birth?: string;
  place_of_birth?: string;
  age?: string;
  nationality?: string;
  gender?: string;
  marital_status?: string;
  height?: string;
  weight?: string;
  id_number?: string;
  passport_number?: string;

  // Formal table sections
  formal_educations?: CvFormalEducation[];
  nonformal_educations?: CvNonformalEducation[];
  employment_history?: CvEmploymentHistory[];
  achievements?: CvAchievement[];
  travel_history?: CvTravelHistory[];
  next_of_kin?: CvNextOfKin;

  // Classic & Modern template fields
  educations: CvEducation[];
  experiences: CvExperience[];
  skills: CvSkill[];
  languages: CvLanguage[];
  leaderships: CvLeadership[];
  activities: CvActivity[];
  interests: CvInterest[];
};
