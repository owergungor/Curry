<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="curry-error-fallback" style="display:none;" aria-hidden="true">
  {#if page?.error}
    {page.error.message}
  {/if}
</div>

<style>
  .curry-error-fallback {
    display: none;
  }
</style>
