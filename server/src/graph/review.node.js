import { reviewDiff, reviewGithubPr } from '../services/review.service.js';

export const reviewNode = async (state) => {
  const { repositoryId, payload } = state;
  const { type, diff, prUrl } = payload;
  
  let result;
  if (type === 'github') {
    result = await reviewGithubPr(parseInt(repositoryId, 10), prUrl.trim());
  } else {
    result = await reviewDiff(parseInt(repositoryId, 10), diff);
  }
  
  return {
    result
  };
};
