import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { ReferralDataModel } from "../models/referral";

const REFERRAL_LOOKUP_URL =
  "https://oss-recruitment.onestepsolutionbali.com/api/referral/get-referral-by-code-unique";

export const useLookupReferral = () => {
  const { mutateAsync: onLookup, isPending: onLookupLoading } = useMutation({
    mutationFn: async (code: string) => {
      const response = await axios.get(REFERRAL_LOOKUP_URL, {
        params: { code_referral: code },
      });
      if (!response.data?.success || !response.data?.result) {
        throw new Error(response.data?.message ?? "Referral not found");
      }
      return response.data.result as ReferralDataModel;
    },
  });

  return { onLookup, onLookupLoading };
};
