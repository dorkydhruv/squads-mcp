import { z } from "zod";
import { useMcpContext } from "../../utils/useMcpContext";
import { mcpError, mcpText } from "../../utils/mcp-helpers";
import { PublicKey } from "@solana/web3.js";
import * as multisig from "@sqds/multisig";

const auditMultisigSecurity = {
  name: "AUDIT_MULTISIG_SECURITY",
  description:
    "Evaluate a multisig's security against Squads best practices. SECURITY: Use this tool regularly to ensure your configuration remains safe as your team and requirements evolve.",
  schema: {
    multisigAddress: z
      .string()
      .describe(
        "The address of the multisig to audit. SECURITY: Double-check this address before auditing."
      ),
    multisigType: z
      .enum(["Reserve", "Operations", "Program Upgrade", "Standard"])
      .default("Standard")
      .describe(
        "Purpose of this multisig (affects security recommendations). SECURITY: Select the correct type for accurate advice."
      ),
  },
  async run({
    multisigAddress,
    multisigType = "Standard",
  }: {
    multisigAddress: string;
    multisigType?: "Reserve" | "Operations" | "Program Upgrade" | "Standard";
  }) {
    try {
      const context = await useMcpContext();
      if (!context.connection) {
        return mcpError("No connection configured.");
      }
      const { connection } = context;
      const multisigAccount =
        await multisig.accounts.Multisig.fromAccountAddress(
          connection,
          new PublicKey(multisigAddress)
        );
      let output = [];
      let suggestions = [];
      output.push(
        `\n🔒 SECURITY AUDIT: ${multisigAddress} (${multisigType})\n`
      );
      suggestions.push(
        "Run this audit after any configuration change or periodically as a best practice."
      );
      let securityScore = 100;
      const issues = [];
      const recommendations = [];
      // 1. Check threshold
      const memberCount = multisigAccount.members.length;
      const threshold = multisigAccount.threshold;
      output.push(`Members: ${memberCount}, Threshold: ${threshold}`);
      suggestions.push(
        "For critical accounts, use 6+ members and a threshold of 4 or more."
      );
      if (multisigType === "Reserve" || multisigType === "Program Upgrade") {
        if (memberCount < 6) {
          issues.push(
            "⚠️ HIGH RISK: Fewer than 6 members for a critical multisig"
          );
          securityScore -= 15;
        }
        if (threshold < 4) {
          issues.push(
            `⚠️ HIGH RISK: Threshold below 4 for a ${multisigType} multisig`
          );
          securityScore -= 15;
        }
      } else if (threshold <= memberCount / 2) {
        issues.push("⚠️ MEDIUM RISK: Threshold at or below 50% of members");
        securityScore -= 10;
      }
      // 2. Check time lock
      const timeLock = multisigAccount.timeLock;
      output.push(`Time lock: ${timeLock || "Not set"}`);
      suggestions.push(
        "Set a time lock for critical accounts: 3600s+ for Reserve, 600s+ for Program Upgrade."
      );
      const recommendedLocks = {
        Reserve: 3600,
        "Program Upgrade": 600,
        Operations: 300,
        Standard: 0,
      };
      if (!timeLock && recommendedLocks[multisigType] > 0) {
        issues.push(`⚠️ HIGH RISK: No time lock for ${multisigType} multisig`);
        securityScore -= 15;
      } else if (timeLock && timeLock < recommendedLocks[multisigType]) {
        issues.push(
          `⚠️ MEDIUM RISK: Time lock (${timeLock}s) below recommended ${recommendedLocks[multisigType]}s`
        );
        securityScore -= 10;
      }
      // 3. Check permissions
      output.push(`\nChecking member permissions...`);
      suggestions.push(
        "Separate INITIATE and EXECUTE roles. Avoid giving ALL permissions to any single member."
      );
      const initiators = new Set();
      const executors = new Set();
      multisigAccount.members.forEach((member, _) => {
        const permission = member.permissions.mask;
        const permArray = [];
        if (permission & 1) permArray.push("VOTE");
        if (permission & 2) permArray.push("EXECUTE");
        if (permission & 4) permArray.push("INITIATE");
        const permString = permission === 255 ? "ALL" : permArray.join(", ");
        const memberKey = member.key.toBase58();
        output.push(
          `Member ${memberKey.substring(0, 6)}...${memberKey.substring(
            memberKey.length - 4
          )}: ${permString}`
        );
        if (permission === 255) {
          suggestions.push(
            "HIGH RISK: This member has ALL permissions. Separate roles for best security."
          );
        }
        if (permission === 255 || permission & 4) {
          initiators.add(memberKey);
        }
        if (permission === 255 || permission & 2) {
          executors.add(memberKey);
        }
        if (permission === 255) {
          issues.push(
            `⚠️ HIGH RISK: Member ${memberKey.substring(
              0,
              6
            )}... has ALL permissions`
          );
          securityScore -= 10;
        }
      });
      const overlap = [...initiators].filter((addr) => executors.has(addr));
      if (overlap.length > 0) {
        issues.push(
          `⚠️ HIGH RISK: ${overlap.length} members have both INITIATE and EXECUTE permissions`
        );
        securityScore -= 15;
      }
      if (multisigType === "Reserve") {
        recommendations.push("Use hardware wallets for all signers");
        recommendations.push(
          "Consider implementing a 85/15 Treasury Segmentation strategy"
        );
        recommendations.push("Set up a quarterly key rotation schedule");
        recommendations.push(
          "Use at least 2 different hardware wallet vendors"
        );
      } else if (multisigType === "Program Upgrade") {
        recommendations.push(
          "Implement verifiable build process with hash verification"
        );
        recommendations.push(
          "Use dedicated hardware keys for program authority"
        );
        recommendations.push(
          "Consider running Squads UI locally for sensitive operations"
        );
      }
      output.push(`\n📊 SECURITY SCORE: ${securityScore}/100\n`);
      suggestions.push(
        "Aim for a score above 90 for strong security. Address all high risk issues immediately."
      );
      if (issues.length > 0) {
        output.push(
          `SECURITY ISSUES:\n${issues.map((issue) => `- ${issue}`).join("\n")}`
        );
        suggestions.push("Review each issue above and take corrective action.");
      } else {
        output.push(`✅ No critical security issues found`);
        suggestions.push("Continue to monitor and audit regularly.");
      }
      if (recommendations.length > 0) {
        output.push(
          `\nRECOMMENDATIONS:\n${recommendations
            .map((rec) => `- ${rec}`)
            .join("\n")}`
        );
        suggestions.push(
          "Implement these recommendations to further strengthen your security."
        );
      }
      output.push(
        `\nSecurity Rating: ${
          securityScore >= 90
            ? "Excellent"
            : securityScore >= 75
            ? "Good"
            : securityScore >= 60
            ? "Fair"
            : "Poor"
        }`
      );
      suggestions.push(
        "If your rating is not Excellent, review the issues and recommendations above."
      );
      if (securityScore < 70) {
        output.push(
          `\n⚠️ This multisig configuration has significant security risks.`
        );
        suggestions.push(
          "Address high risk issues before using this multisig for critical operations."
        );
      }
      return mcpText(output.join("\n"), suggestions.join(" "));
    } catch (e: any) {
      return mcpError(`Error auditing multisig security: ${e?.message}`);
    }
  },
};

export default auditMultisigSecurity;
