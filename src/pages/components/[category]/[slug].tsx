import Head from 'next/head'

import fs from 'fs'
import matter from 'gray-matter'
import { MDXRemote, MDXRemoteProps } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'

import { Component, ComponentVariant } from '@/interface/component'

import { getComponentPaths } from '@/lib/getComponents'

import List from '@/components/CollectionList'

const mdxComponents = {
  List,
}

type CategoryData = {
  title: string
  emoji: string
  container: string
  seo: {
    title: string
    description: string
  }
  components: {
    title: string
    container?: string
  }
}

type ComponentData = Omit<Component, 'slug'>

type Props = {
  componentSlug: string
  componentSource: MDXRemoteProps
  componentFrontmatter: CategoryData
}

function Component({
  componentSlug,
  componentSource,
  componentFrontmatter,
}: Props) {
  const {
    seo: componentSeo,
    container: componentContainer,
    components: componentsData,
  } = componentFrontmatter

  const componentsArray: Array<Component> = Object.entries(componentsData).map(
    // @ts-expect-error
    function ([componentId, componentData]: [string, ComponentData]) {
      return {
        id: componentId,
        title: componentData.title,
        container: componentData.container ?? '',
        creator: componentData.creator ?? '',
        variants: componentData.variants
          ? Object.entries(componentData.variants).map(function ([
              variantId,
              variantData,
            ]: [string, ComponentVariant]) {
              return {
                id: variantId,
                title: variantData.title,
                container: variantData.container ?? '',
              }
            })
          : [],
      }
    }
  )

  const componentData = {
    componentSlug,
    componentContainer,
    componentsArray,
  }

  return (
    <>
      <Head>
        <title>Tailwind CSS {componentSeo.title} | HyperUI</title>
        <meta
          name="description"
          content={componentSeo.description}
          key="description"
        />
        <meta
          property="og:title"
          content={`Tailwind CSS ${componentSeo.title} | HyperUI`}
          key="og:title"
        />
        <meta
          property="og:description"
          content={componentSeo.description}
          key="og:description"
        />
        <meta
          name="twitter:title"
          content={`Tailwind CSS ${componentSeo.title} | HyperUI`}
          key="twitter:title"
        />
        <meta
          name="twitter:description"
          content={componentSeo.description}
          key="twitter:description"
        />
      </Head>

      <section>
        <div className="max-w-screen-xl px-4 py-12 mx-auto lg:pt-24">
          <div className="prose max-w-none">
            <MDXRemote
              {...componentSource}
              components={mdxComponents}
              scope={componentData}
            />
          </div>
        </div>
      </section>
    </>
  )
}

type Params = {
  params: {
    category: string
    slug: string
  }
}

export async function getStaticProps({ params: { category, slug } }: Params) {
  const categorySlug = category
  const componentSlug = slug

  const componentSource = fs.readFileSync(
    `./src/data/components/${categorySlug}-${componentSlug}.mdx`
  )

  const { content: componentContent, data: componentData } =
    matter(componentSource)

  const mdxSource = await serialize(componentContent, {
    mdxOptions: {
      rehypePlugins: [],
      remarkPlugins: [],
    },
    scope: componentData,
  })

  return {
    props: {
      componentSource: mdxSource,
      componentFrontmatter: componentData,
      componentSlug,
    },
  }
}

export async function getStaticPaths() {
  const componentPaths = getComponentPaths()

  return {
    paths: componentPaths,
    fallback: false,
  }
}

export default Component