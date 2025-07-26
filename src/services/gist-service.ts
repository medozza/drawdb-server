import axios from 'axios';
import { gistsBaseUrl, headers } from '../constants/gist-constants';

export const GistService = {
  getCommits: async (gistId: string, perPage?: number, page?: number) => {
    const { data } = await axios.get(`${gistsBaseUrl}/${gistId}/commits`, {
      headers,
      params: {
        per_page: perPage,
        page,
      },
    });

    return data;
  },

  getRevision: async (gistId: string, sha: string) => {
    const { data } = await axios.get(`${gistsBaseUrl}/${gistId}/${sha}`, {
      headers,
    });

    return data;
  },
};
