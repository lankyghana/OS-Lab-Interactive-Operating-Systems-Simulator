/**
 * About & project settings — edit this file to update the About and Contribute pages.
 * Any field left empty ('' or []) is simply not shown.
 */

export const DEVELOPER = {
  name: 'Daniel Kwadwo Takyi',
  /** One line under the name, e.g. "Software engineer" or "Computer Science student". */
  headline: 'Software engineer and UI/UX designer',
  location: '',
  /** Short paragraphs, first person, shown under "About me". */
  bio: [] as string[],
  /** Square photo URL (an image inside /public works best). Initials are shown if empty. */
  avatarUrl: '',
  /** What you focus on, shown as small tags, e.g. ['TypeScript', 'Systems', 'EdTech']. */
  focus: [] as string[],
  links: {
    linkedin: 'https://www.linkedin.com/in/dk-takyi',
    github: 'https://github.com/lankyghana',
    website: '',
    email: 'danielkwadwotakyi@gmail.com',
  },
};

export const PROJECT = {
  name: 'OS Lab',
  /** Public repository URL, e.g. https://github.com/<account>/os-lab. Used in every clone command. */
  repoUrl: 'https://github.com/lankyghana/OS-Lab-Interactive-Operating-Systems-Simulator',
  license: 'MIT',
  /** Where contributors ask questions: GitHub Discussions URL, Discord invite, etc. */
  discussionUrl: '',
  /** Private address for security reports (see SECURITY.md). Falls back to DEVELOPER.links.email. */
  securityEmail: '',
};

export const repoUrl = () => PROJECT.repoUrl || 'https://github.com/<your-account>/os-lab';
export const repoReady = () => PROJECT.repoUrl.length > 0;
/** Folder name created by `git clone`. */
export const repoDir = () => repoUrl().replace(/\.git$/, '').split('/').pop() || 'os-lab';
/** Fork URL pattern for contributors: same repository name under their own account. */
export const forkUrl = () => repoUrl().replace(/github\.com\/[^/]+\//, 'github.com/<your-github-username>/');
