# LLM Context & AI Workflow
.PHONY: create-map
create-map: ## Generate repo-context.txt for LLM (requires aider)
	@printf "$(CYAN)  Generating repo context map...$(RESET)\n"
	@aider --show-repo-map . > repo-context.txt
	@printf "$(GREEN)  ✔ Context map generated → repo-context.txt$(RESET)\n"
	@printf "$(YELLOW)  ℹ Use with: aider --llm-context repo-context.txt .$(RESET)\n"

.PHONY: llm-help
llm-help: ## Show LLM workflow instructions
	@echo ""
	@printf "$(BOLD)$(MAGENTA)  LLM Context & AI Workflows$(RESET)\n"
	@echo ""
	@printf "$(BOLD)  1. Generate Context Map:$(RESET)\n"
	@printf "     make create-map\n"
	@echo ""
	@printf "$(BOLD)  2. Use with Aider:$(RESET)\n"
	@printf "     aider --llm-context repo-context.txt .\n"
	@echo ""
	@printf "$(BOLD)  3. Share Context with LLMs:$(RESET)\n"
	@printf "     Attach repo-context.txt to your LLM prompt/chat\n"
	@echo ""
	@printf "$(BOLD)  4. Example Prompt:$(RESET)\n"
	@printf "     \"Using repo-context.txt, add a 'triangle' drawing tool.\"\n"
	@echo ""
	@printf "$(YELLOW)  ℹ repo-context.txt contains:\n"
	@printf "     - Project structure & tech stack\n"
	@printf "     - Key data flows & patterns\n"
	@printf "     - Common tasks & file locations\n"
	@printf "     - Security & configuration guidelines$(RESET)\n"
	@echo ""