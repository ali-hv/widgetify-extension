export interface VideoFile {
	name: string
	getFile(): Promise<File>
	getCaptions?(): Promise<File>
}
