import { check, instance, object, pipe, string } from 'valibot'

export const DeployGeneralSchema = object({
  name: string('name should be string'),
  dist: pipe(
    instance(File, 'dist should be file'),
    check(file => file.name.endsWith('.tar.gz'), 'dist should be tar.gz file'),
  ),
  outpath: string('outpath should be string'),
})
