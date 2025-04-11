<script>
  import { Ttabs, TtabsRoot, darkTheme } from 'ttabs-svelte';
  
  // Create a ttabs instance
  const ttabs = new Ttabs({
    theme: darkTheme,
    // Other options as needed
  });

  // Optional: Initialize with some content
  // We'll set this up once we've moved the existing code to the package
</script>

<div class="container">
  <h1>Basic ttabs Example</h1>
  
  <div class="ttabs-container">
    <TtabsRoot {ttabs} />
  </div>
</div>

<style>
  .container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .ttabs-container {
    flex: 1;
    min-height: 0;
    border: 1px solid #ccc;
  }
</style> 