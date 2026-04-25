export type InformationCountryCountryModel = {
  id: string;
  name: string;
};

export type InformationCountryDataModel = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  country_id: string;
  priority: string;
  country?: InformationCountryCountryModel | null;
  created_at: string;
  updated_at: string;
};

export type InformationCountryPayloadCreateModel = {
  slug: string;
  title: string;
  priority: string;
  description?: string | null;
  country_id: string;
};

export type InformationCountryPayloadUpdateModel = {
  slug?: string;
  title?: string;
  priority?: string;
  description?: string | null;
  country_id?: string;
};
