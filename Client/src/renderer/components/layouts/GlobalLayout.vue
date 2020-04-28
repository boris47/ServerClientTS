
<!-- The template element is used to declare fragments of HTML that can be cloned and inserted in the document by script. -->
<template>
	<!-- The div element has no special meaning at all. It represents its children.
	It can be used with the class, lang, and title attributes to mark up semantics common to a group of consecutive elements.-->
	<div>
		<!-- The header element represents introductory content for its nearest ancestor sectioning content or sectioning root element.
		A header typically contains a group of introductory or navigational aids.
		When the nearest ancestor sectioning content or sectioning root element is the body element, then it applies to the whole page.-->
		<header>
			<!-- <slot> serve as content distribution outlets in component templates. <slot> itself will be replaced. -->
			<slot name="header"></slot>
		</header>
		<!-- The main element represents the main content of the body of a document or application.
		The main content area consists of content that is directly related to or expands upon the central topic of a document or central functionality of an application.-->
		<main>
			<slot name="main"></slot>
		</main>
		<!-- The footer element represents a footer for its nearest ancestor sectioning content or sectioning root element.
		A footer typically contains information about its section such as who wrote it, links to related documents, copyright data, and the like.-->
		<footer>
			<slot name="footer"></slot>
		</footer>
		<!-- The aside element represents a section of a page that consists of content that is tangentially related to the content around the aside element,
		and which could be considered separate from that content. Such sections are often represented as sidebars in printed typography.-->
		<aside>
			<slot name="sidebar"></slot>
		</aside>
	</div>
</template>


<script lang="ts">

	export default {

		name: "GlobalLayout"

	};
	
</script>


<style scoped>
</style>