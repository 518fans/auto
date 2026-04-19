import { distributePosts, publishRepos } from './blog-ops.mjs';

const { movedPosts, stagedPathsByRepo } = await distributePosts();
publishRepos(stagedPathsByRepo);
console.log(`Synced ${movedPosts.length} post(s) across ${stagedPathsByRepo.size} repo(s).`);
