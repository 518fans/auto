import blogConfig from '../blog.config.mjs';
import { publishRepos } from './blog-ops.mjs';

const stagedPathsByRepo = new Map(
  Object.keys(blogConfig.automation.repoMap).map((repoName) => [
    repoName,
    new Set([blogConfig.automation.repoMap[repoName].contentDir]),
  ]),
);

publishRepos(stagedPathsByRepo);
console.log('Published configured repositories.');
