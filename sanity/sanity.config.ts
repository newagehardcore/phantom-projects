'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { projectSchema } from './schema/project'
import { aboutSchema } from './schema/about'

export default defineConfig({
  name: 'phantom-projects',
  title: 'Phantom Projects',

  basePath: '/studio',

  projectId: 'hc7jjv49',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('About')
              .id('about')
              .child(
                S.document()
                  .schemaType('about')
                  .documentId('about')
              ),
            S.divider(),
            S.documentTypeListItem('project').title('Projects'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: [projectSchema, aboutSchema],
  },

})
