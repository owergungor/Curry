<script module lang="ts">
  export type { DropdownItem } from "./components/Dropdown.svelte";
</script>

<script lang="ts">
  import DropdownComponent, { type DropdownItem } from "./components/Dropdown.svelte";

  let {
    items = [],
    value = $bindable(""),
    disabled = false,
    id = "",
    ariaLabel = "Select option",
    onchange = undefined,
    onSelect = undefined,
  }: {
    items: DropdownItem[];
    value?: string;
    disabled?: boolean;
    id?: string;
    ariaLabel?: string;
    onchange?: (val: string) => void;
    onSelect?: (val: string) => void;
  } = $props();
</script>

<DropdownComponent
  {items}
  bind:value
  {disabled}
  {id}
  {ariaLabel}
  {onchange}
  {onSelect}
/>
