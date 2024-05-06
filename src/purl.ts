import * as z from 'zod'

// the basic purl type, containing type, namespace, name, and version.
// other than type, all fields are nullable. this is for maximum flexibility
// at the cost of strict adherence to the package-url spec.
export const PurlSchema = z.object({
  type: z.string(),
  namespace: z.string().nullable(),
  name: z.string().nullable(), // name is nullable for deny-groups
  version: z.string().nullable(),
  original: z.string(),
  error: z.string().nullable()
})

export type PackageURL = z.infer<typeof PurlSchema>

const PURL_TYPE = /pkg:([a-zA-Z0-9-_]+)\/.*/

export function parsePURL(purl: string): PackageURL {
  const result: PackageURL = {
    type: '',
    namespace: null,
    name: null,
    version: null,
    original: purl,
    error: null
  }
  if (!purl.startsWith('pkg:')) {
    result.error = 'package-url must start with "pkg:"'
    return result
  }
  const type = purl.match(PURL_TYPE)
  if (!type) {
    result.error = 'package-url must contain a type'
    return result
  }
  result.type = type[1]
  const parts = purl.split('/')
  // the first 'part' should be 'pkg:ecosystem'
  if (parts.length < 2 || !parts[1]) {
    result.error = 'package-url must contain a namespace or name'
    return result
  }
  let namePlusRest: string
  if (parts.length === 2) {
    namePlusRest = parts[1]
  } else {
    result.namespace = decodeURIComponent(parts[1])
    // Add back the '/'s to the rest of the parts, in case there are any more.
    // This may violate the purl spec, but people do it and it can be parsed
    // without ambiguity.
    namePlusRest = parts.slice(2).join('/')
  }
  const name = namePlusRest.match(/([^@#?]+)[@#?]?.*/)
  if (!result.namespace && !name) {
    result.error = 'package-url must contain a namespace or name'
    return result
  }
  if (!name) {
    // we're done here
    return result
  }
  result.name = decodeURIComponent(name[1])
  const version = namePlusRest.match(/@([^#?]+)[#?]?.*/)
  if (!version) {
    return result
  }
  result.version = decodeURIComponent(version[1])

  // we don't parse subpath or attributes, so we're done here
  return result
}
