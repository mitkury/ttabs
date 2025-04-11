<script lang="ts">
  // Props for the document component
  let { documentId = '', title = 'Untitled Document', content = 'No content available', ttabs, contentId } = $props();

  // Simulate document loading
  let isLoading = $state(true);

  // Use effect to simulate loading
  $effect(() => {
    const timer = setTimeout(() => {
      isLoading = false;
    }, 1000);

    return () => clearTimeout(timer);
  });
</script>

<div class="document-component">
  <div class="document-header">
    <h2>{title}</h2>
    <div class="document-id">ID: {documentId}</div>
  </div>
  <div class="document-content">
    {#if isLoading}
      <div class="loading">Loading document...</div>
    {:else}
      <div class="content-body">
        {content}
      </div>
    {/if}
  </div>
</div>

<style>
  .document-component {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
    background-color: #fff;
  }
  
  .document-header {
    padding: 1rem;
    background-color: #f9f9f9;
    border-bottom: 1px solid #ddd;
  }
  
  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #333;
  }
  
  .document-id {
    font-size: 0.8rem;
    color: #777;
  }
  
  .document-content {
    flex: 1;
    padding: 1rem;
    overflow: auto;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #777;
    font-style: italic;
  }
  
  .content-body {
    line-height: 1.6;
    color: #333;
  }
</style> 