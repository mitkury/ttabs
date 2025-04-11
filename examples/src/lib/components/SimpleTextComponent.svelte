<script lang="ts">
  // Simple component to display text content
  let { text = "" } = $props();
</script>

<div class="text-content">
  {#if text}
    <pre>{text}</pre>
  {:else}
    <p class="empty-text">No content available</p>
  {/if}
</div>

<style>
  .text-content {
    padding: 1rem;
    height: 100%;
    overflow: auto;
    background: #f9f9f9;
  }
  
  pre {
    font-family: monospace;
    white-space: pre-wrap;
    margin: 0;
  }
  
  .empty-text {
    color: #888;
    font-style: italic;
  }
</style> 