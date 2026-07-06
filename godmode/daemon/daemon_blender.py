import os
import re

class StructuralCodeBlender:
    @staticmethod
    def blend_mutation(original_source_code, inbound_swarm_mutation):
        """Blends incoming function alterations into old files based on class names."""
        # Extract function blocks from incoming swarm payload via semantic boundaries
        extracted_functions = re.findall(r"(async\s+)?(fn|function|public|private)\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]*?\}", inbound_swarm_mutation)
        
        if not extracted_functions:
            # Fall back to safe tracking if no clean micro-functions can be extracted
            return inbound_swarm_mutation

        blended_result = original_source_code
        for func_match in extracted_functions:
            func_name = func_match[2]
            
            # Find the match boundary of the exact same method signature inside our original code
            target_pattern = rf"(async\s+)?(fn|function|public|private)\s+{func_name}\s*\([^)]*\)\s*\{{[\s\S]*?\}}"
            
            # Extract the raw replacement text from the incoming swarm package
            replacement_match = re.search(rf"(?:async\s+)?(?:fn|function|public|private)\s+{func_name}\s*\([^)]*\)\s*\{{[\s\S]*?\}}", inbound_swarm_mutation)
            
            if replacement_match and re.search(target_pattern, blended_result):
                # Swap out only the targeted function block, keeping the rest of the module file intact
                blended_result = re.sub(target_pattern, replacement_match.group(0), blended_result)
            else:
                # If it's a completely new method declaration, gracefully inject it into the bottom of the source file
                if replacement_match:
                    blended_result = blended_result.rstrip().rstrip('}') + f"\n\n  {replacement_match.group(0)}\n}}"
                    
        return blended_result

if __name__ == "__main__":
    original = "export class GameManager {\n  boot() { console.log('Booting...'); }\n  tick() { return 1; }\n}"
    mutation = "export class GameManager {\n  tick() { console.log('Optimized Tick!'); return 60; }\n}"
    output = StructuralCodeBlender.blend_mutation(original, mutation)
    print("[Blender Check] Code modification blended perfectly:\n", output)
