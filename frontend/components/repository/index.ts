// analyzer_webui/components/repository/index.ts
import EnhancedRepositoryDiscovery from './EnhancedRepositoryDiscovery';
import RepositoryDetails from './RepositoryDetails';
import RepositoryForm from './RepositoryForm';
import RepositoryTags from './RepositoryTags';

export {
  EnhancedRepositoryDiscovery,
  RepositoryDetails,
  RepositoryForm,
  RepositoryTags
};

// Export the plugin creation function
export { createRepositoryCommandPlugin } from '@/components/command-manager/plugins/repositoryCommandPlugin';