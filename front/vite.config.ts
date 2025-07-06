import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server.fs.strict
  server: {
    fs: {
      // strict: false, // Allow access to files outside the project root
      allow: [
        // search up for workspace root
        searchForWorkspaceRoot(process.cwd()),
        // NOT GOOD, but needed to access the @fontsource-poppins-npm package in the Yarn cache
        'C:/Users/Ashley/AppData/Local/Yarn/Berry/cache/'
      ],
    },
  },
});
