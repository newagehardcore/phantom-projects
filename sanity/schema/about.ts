import { defineType, defineField } from 'sanity'

export const aboutSchema = defineType({
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'PHANTOM PROJECTS',
      validation: (Rule) => Rule.max(80),
    }),
    defineField({
      name: 'headerDescription',
      title: 'Header description',
      description: 'A short highlighted sentence shown before the bio.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      description: 'Shown first as a Contact email link.',
      type: 'string',
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
    }),
    defineField({
      name: 'socials',
      title: 'Social Links',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string' }),
            defineField({
              name: 'url',
              type: 'url',
              validation: (Rule) => Rule.uri({ scheme: ['http', 'https', 'mailto'] }),
            }),
          ],
        },
      ],
    }),
  ],
})
