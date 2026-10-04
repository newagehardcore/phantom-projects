import { defineType, defineField } from 'sanity'
import PhotoGalleryInput from '../components/PhotoGalleryInput'
import MonthYearInput from '../components/MonthYearInput'

export const projectSchema = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitleType',
      title: 'Subtitle Prefix',
      type: 'string',
      options: {
        list: [
          { title: 'By', value: 'By' },
          { title: 'With', value: 'With' },
          { title: 'For', value: 'For' },
          { title: 'None (in quotes)', value: 'None' },
        ],
      },
    }),
    defineField({
      name: 'subtitleName',
      title: 'Subtitle Name',
      type: 'string',
      description: 'When Subtitle Prefix is None, quotation marks are added automatically on the site. Enter the text without surrounding quotes.',
    }),
    defineField({
      name: 'subtitleUrl',
      title: 'Subtitle URL (optional)',
      type: 'url',
    }),
    defineField({
      name: 'collaborators',
      title: 'Collaborators',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'URL (optional)', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        },
      ],
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'string',
      description: 'Month and year only.',
      components: { input: MonthYearInput },
      validation: (Rule) => Rule.custom((value) =>
        !value || /^\d{4}-(0[1-9]|1[0-2])$/.test(value)
          ? true
          : 'Choose a month and year.'
      ),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Film', value: 'Film' },
          { title: 'Art', value: 'Art' },
          { title: 'Fashion', value: 'Fashion' },
          { title: 'Performance', value: 'Performance' },
          { title: 'Releases', value: 'Releases' },
          { title: 'Campaign', value: 'Campaign' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'roles',
      title: 'Role',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Composition', value: 'Composition' },
          { title: 'Production', value: 'Production' },
          { title: 'Sound Design', value: 'Sound Design' },
          { title: 'Mixing', value: 'Mixing' },
          { title: 'Mastering', value: 'Mastering' },
          { title: 'Recording', value: 'Recording' },
          { title: 'Music Supervision', value: 'Music Supervision' },
          { title: 'Music Direction', value: 'Music Direction' },
          { title: 'Music Editing', value: 'Music Editing' },
          { title: 'Music Programming', value: 'Music Programming' },
          { title: 'Vocal Production', value: 'Vocal Production' },
          { title: 'Conducting', value: 'Conducting' },
          { title: 'Performance', value: 'Performance' },
          { title: 'Arrangement', value: 'Arrangement' },
          { title: 'Orchestration', value: 'Orchestration' },
          { title: 'Songwriting', value: 'Songwriting' },
          { title: 'Film Scoring', value: 'Film Scoring' },
          { title: 'Lyrics', value: 'Lyrics' },
          { title: 'Sound Installation', value: 'Sound Installation' },
          { title: 'Creative Direction', value: 'Creative Direction' },
          { title: 'Audiovisual Direction', value: 'Audiovisual Direction' },
          { title: 'Technical Director', value: 'Technical Director' },
          { title: 'Spatial Audio', value: 'Spatial Audio' },
          { title: 'Keyboardist', value: 'Keyboardist' },
        ],
        layout: 'grid',
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'press',
      title: 'Press',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Publication / Article Title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        },
      ],
    }),
    defineField({
      name: 'presentedAt',
      title: 'Presented At',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Venue / Festival', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'URL (optional)', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        },
      ],
    }),
    defineField({
      name: 'watchOn',
      title: 'Watch On',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Platform / Link Label', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url' }),
          ],
          preview: { select: { title: 'name', subtitle: 'url' } },
        },
      ],
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      description: 'Drag and drop multiple images here to upload them as a batch.',
      type: 'array',
      components: { input: PhotoGalleryInput },
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          initialValue: { hotspot: { x: 0.5, y: 0.25, width: 1, height: 1 }, displayRole: 'both' },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({
              name: 'displayRole',
              title: 'Show in',
              type: 'string',
              initialValue: 'both',
              options: {
                list: [
                  { title: 'Wall thumbnail cycling only', value: 'thumbnail' },
                  { title: 'Project modal only', value: 'project' },
                  { title: 'Both (thumbnail cycling + modal)', value: 'both' },
                ],
                layout: 'radio',
              },
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'videos',
      title: 'Videos',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'uploadedVideo',
          title: 'Uploaded Video',
          fields: [
            defineField({ name: 'file', type: 'file' }),
            defineField({ name: 'caption', type: 'string' }),
            defineField({
              name: 'displayRole',
              title: 'Show in',
              type: 'string',
              initialValue: 'project',
              options: {
                list: [
                  { title: 'Wall thumbnail cycling only', value: 'thumbnail' },
                  { title: 'Project modal only', value: 'project' },
                  { title: 'Both (thumbnail cycling + modal)', value: 'both' },
                ],
                layout: 'radio',
              },
            }),
          ],
        },
        {
          type: 'object',
          name: 'linkedVideo',
          title: 'Linked Video (YouTube / Vimeo)',
          fields: [
            defineField({ name: 'url', type: 'url', description: 'YouTube or Vimeo URL' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'audio',
      title: 'Audio',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'file', type: 'file' }),
            defineField({ name: 'caption', type: 'string' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'links',
      title: 'External Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({ name: 'url', type: 'url' }),
          ],
        },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower number = more prominent position on the wall.',
    }),
  ],
})
