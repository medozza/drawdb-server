/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { all, type AxiosError } from 'axios';
import { Request, Response } from 'express';
import { IGistCommitItem } from '../interfaces/gist-commit-item';
import { IGistFile } from '../interfaces/gist-file';
import { gistsBaseUrl, headers } from '../constants/gist-constants';
import { GistService } from '../services/gist-service';

async function get(req: Request, res: Response) {
  try {
    const { data } = await axios.get(`${gistsBaseUrl}/${req.params.id}`, {
      headers,
    });

    const {
      owner,
      history,
      forks,
      user,
      url,
      forks_url,
      commits_url,
      git_pull_url,
      git_push_url,
      html_url,
      comments_url,
      ...rest
    } = data;

    const cleanedFiles = Object.fromEntries(
      Object.entries(rest.files as Record<string, IGistFile>).map(
        ([filename, { raw_url, ...fileWithoutRaw }]) => [filename, fileWithoutRaw],
      ),
    );

    res.status(200).json({
      success: true,
      data: { ...rest, files: cleanedFiles },
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

async function create(req: Request, res: Response) {
  try {
    const { description, filename, content, public: isGistPublic } = req.body;

    const { data } = await axios.post(
      gistsBaseUrl,
      {
        description,
        public: isGistPublic,
        files: {
          [filename]: { content },
        },
      },
      { headers },
    );

    const returnData = {
      id: data.id,
      files: data.files,
    };

    res.status(200).json({
      success: true,
      data: returnData,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: 'Something went wrong',
    });
  }
}

async function update(req: Request, res: Response) {
  try {
    const { filename, content } = req.body;

    await axios.patch(
      `${gistsBaseUrl}/${req.params.id}`,
      {
        files: {
          [filename]: { content },
        },
      },
      { headers },
    );

    res.status(200).json({
      success: true,
      message: 'Gist updated',
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

async function del(req: Request, res: Response) {
  try {
    await axios.delete(`${gistsBaseUrl}/${req.params.id}`, {
      headers,
    });

    res.status(200).json({
      success: true,
      message: 'Gist deleted',
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

async function getCommits(req: Request, res: Response) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const perPage = req.query.per_page ? parseInt(req.query.per_page as string) : undefined;
    const data = await GistService.getCommits(req.params.id, perPage, page);

    const cleanData = data.map((x: IGistCommitItem) => {
      const { user, url, ...rest } = x;
      return rest;
    });

    res.status(200).json({
      success: true,
      data: cleanData,
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

async function getRevision(req: Request, res: Response) {
  try {
    const data = await GistService.getRevision(req.params.id, req.params.sha);

    const {
      owner,
      history,
      forks,
      user,
      url,
      forks_url,
      commits_url,
      git_pull_url,
      git_push_url,
      html_url,
      comments_url,
      ...rest
    } = data;

    const cleanedFiles = Object.fromEntries(
      Object.entries(rest.files as Record<string, IGistFile>).map(
        ([filename, { raw_url, ...fileWithoutRaw }]) => [filename, fileWithoutRaw],
      ),
    );

    res.status(200).json({
      success: true,
      data: { ...rest, files: cleanedFiles },
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

async function getRevisionsForFile(req: Request, res: Response) {
  try {
    const gistId = req.params.id;
    const file = req.params.file;

    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const perPage = req.query.per_page ? parseInt(req.query.per_page as string) : undefined;

    const allCommits = await GistService.getCommits(gistId, perPage, page);
    const versionsToExclude: string[] = [];

    const promises = allCommits.map((version: IGistCommitItem) =>
      GistService.getRevision(gistId, version.version).then((revision) => {
        if (!revision.files[file]) {
          versionsToExclude.push(version.version);
        }
      }),
    );

    await Promise.all(promises);

    const versions = allCommits
      .filter((v: IGistCommitItem) => !versionsToExclude.includes(v.version))
      .map((v: IGistCommitItem) => {
        const { user, url, ...rest } = v;
        return rest;
      });

    res.status(200).json({
      success: true,
      data: versions,
    });
  } catch (e) {
    if ((e as AxiosError).status === 404) {
      res.status(404).json({
        success: false,
        message: 'Gist not found',
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Something went wrong',
      });
    }
  }
}

export { get, create, del, update, getCommits, getRevision, getRevisionsForFile };
