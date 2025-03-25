import { check, includes, instance, object, pipe, startsWith, string } from 'valibot'

export const DeploySewaSchema = object({
  name: string('name should be string'),
  dist: pipe(
    instance(File, 'dist should be file'),
    check(file => file.name.endsWith('.tar.gz'), 'dist should be tar.gz file'),
  ),
  outpath: pipe(
    string('outpath should be string'),
    startsWith('/', 'outpath should be absolute path'),
  ),
  sshdest: pipe(string('sshdest should be string'), includes('@', 'sshdest should be "user@host"')),
})
