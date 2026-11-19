/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Kept in a plain (non-client) module so the server layout can inline it.
 */
export const THEME_KEY = 'os-lab:theme';

export const THEME_SCRIPT = `(function(){var t='light';try{var p=localStorage.getItem('${THEME_KEY}')||'light';t=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'}catch(e){}document.documentElement.dataset.theme=t})()`;
