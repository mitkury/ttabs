<script lang="ts">
  // Props for the editor component
  let { content = '', language = 'text', readOnly = false, ttabs, contentId } = $props();
</script>

<div class="editor-component">
  <div class="editor-header">
    <div class="language-badge">{language}</div>
    {#if readOnly}
      <div class="readonly-badge">Read Only</div>
    {/if}
  </div>
  <div class="editor-content">
    {#if readOnly}
      <pre><code>{content}</code></pre>
    {:else}
      <textarea bind:value={content}></textarea>
    {/if}
  </div>
</div>

<style>
  .editor-component {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .editor-header {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }
  
  .language-badge {
    background-color: #4a6cf7;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    text-transform: uppercase;
  }
  
  .readonly-badge {
    background-color: #f7a54a;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-left: 0.5rem;
    text-transform: uppercase;
  }
  
  .editor-content {
    flex: 1;
    overflow: auto;
  }
  
  textarea {
    width: 100%;
    height: 100%;
    padding: 0.5rem;
    border: none;
    resize: none;
    font-family: monospace;
    font-size: 0.9rem;
  }
  
  pre {
    margin: 0;
    padding: 0.5rem;
    font-family: monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
  }
</style> 