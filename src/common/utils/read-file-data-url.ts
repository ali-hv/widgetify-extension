export function readFileDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			if (typeof reader.result === 'string') resolve(reader.result)
			else reject(new Error('UPLOAD_FAILED'))
		}
		reader.onerror = () => reject(new Error('UPLOAD_FAILED'))
		reader.onabort = () => reject(new Error('UPLOAD_FAILED'))
		reader.readAsDataURL(file)
	})
}
