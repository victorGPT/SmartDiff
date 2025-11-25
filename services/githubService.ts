import { Octokit } from "@octokit/rest";

// GitHub Service for SmartDiff
// Uses Octokit to interact with the GitHub API for retrieving and committing files.

/**
 * Validates the GitHub Token by making a simple request (getting the authenticated user).
 */
export const validateGithubToken = async (token: string): Promise<boolean> => {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.users.getAuthenticated();
    return true;
  } catch (error) {
    console.error("GitHub Token Validation Failed:", error);
    return false;
  }
};

/**
 * Fetches file content from a repository.
 * Returns the decoded content and the blob SHA (needed for updates).
 */
export const fetchFileFromGithub = async (
  token: string, 
  owner: string, 
  repo: string, 
  path: string, 
  branch: string
): Promise<{ content: string; sha: string }> => {
  const octokit = new Octokit({ auth: token });
  
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(response.data)) {
      throw new Error("Path points to a directory, not a file.");
    }

    if (!('content' in response.data)) {
        throw new Error("No content found in response.");
    }

    // Decode base64 content
    // Note: GitHub API returns content in base64
    const content = atob(response.data.content.replace(/\n/g, ''));
    // Handle UTF-8 properly
    const decodedContent = decodeURIComponent(escape(content));
    
    return {
      content: decodedContent,
      sha: response.data.sha,
    };
  } catch (error) {
    console.error("Fetch File Error:", error);
    throw error;
  }
};

/**
 * Pushes (commits) file content to a repository.
 * Creates a new file or updates an existing one.
 */
export const pushFileToGithub = async (
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  content: string,
  message: string
): Promise<void> => {
  const octokit = new Octokit({ auth: token });

  let sha: string | undefined;

  // 1. Try to get the file SHA first (to update)
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (!Array.isArray(data) && 'sha' in data) {
      sha = data.sha;
    }
  } catch (e: any) {
    if (e.status !== 404) {
      // If error is NOT 404 (file not found), rethrow it
      console.error("Error checking file existence:", e);
      throw e;
    }
    // If 404, it means we are creating a new file, so sha remains undefined
  }

  // 2. Commit the file
  try {
    // Encode content to Base64 (UTF-8 safe)
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      branch,
      message,
      content: encodedContent,
      sha, // Undefined for new file, present for update
    });
  } catch (error) {
    console.error("Push File Error:", error);
    throw error;
  }
};