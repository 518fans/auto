import { distributePosts } from './blog-ops.mjs';

const { movedPosts } = await distributePosts();
console.log(`Moved ${movedPosts.length} post(s).`);
