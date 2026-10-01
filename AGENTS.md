<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Use Lovable Cloud authentication and private per-user profiles for persistent accounts; the user explicitly requested real database-backed accounts.
- Store bookmarks and post reports as private per-user records protected by database access rules, so saved content and reports cannot leak between accounts.
- Treat ybs, thorvox, and mindcaster as curated verified accounts in presentation code until account verification becomes database-managed.
- Store user language and appearance preferences locally so display choices apply immediately without profile writes.
- Keep follow relationships in the user_follows table with authenticated row-level access; follows must persist across sessions.
