export interface IGithubTemplateFile {
  name: string;
  // biome-ignore lint/style/useNamingConvention: ignore
  download_url: string | null;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
}

export interface ITemplateFileSource {
  fileName: string;
  downloadUrl: string | null;
}
