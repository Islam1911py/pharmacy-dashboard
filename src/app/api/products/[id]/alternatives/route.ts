import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromToken, hasPermission } from '@/lib/rbac';
import { LLM } from 'z-ai-web-dev-sdk';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

// GET /api/products/[id]/alternatives - Get AI-suggested alternatives
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const userPayload = getUserFromToken(authHeader);

    if (!userPayload) {
      return unauthorizedResponse();
    }

    if (!hasPermission(userPayload.role as any, 'products.view')) {
      return forbiddenResponse();
    }

    // Get the product
    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return notFoundResponse('Product not found');
    }

    // Find similar products by active ingredient and category
    const similarProducts = await db.product.findMany({
      where: {
        AND: [
          { id: { not: params.id } },
          { isActive: true },
          { stockQuantity: { gt: 0 } },
          {
            OR: [
              { activeIngredient: product.activeIngredient },
              { category: product.category },
            ],
          },
        ],
      },
      take: 10,
    });

    if (similarProducts.length === 0) {
      return successResponse({
        alternatives: [],
        message: 'No alternatives found',
      });
    }

    // Use AI to analyze and rank alternatives
    const aiPrompt = `You are a professional pharmacist. I need you to analyze and rank these alternative products for a customer.

Original Product:
- Name: ${product.name}
- Category: ${product.category}
- Active Ingredient: ${product.activeIngredient}
- Dosage Form: ${product.dosageForm}
- Description: ${product.description || 'N/A'}

Available Alternatives:
${similarProducts.map(p => `
- Name: ${p.name}
- Category: ${p.category}
- Active Ingredient: ${p.activeIngredient}
- Dosage Form: ${p.dosageForm}
- Price: $${p.price}
- Description: ${p.description || 'N/A'}
`).join('\n')}

Task:
1. Analyze which alternatives are most suitable based on:
   - Same active ingredient (highest priority)
   - Similar category and usage
   - Compatible dosage form
   - Price competitiveness
2. Provide natural, professional recommendations explaining why each alternative is suitable
3. Rank them from most to least suitable
4. If no product has the same active ingredient, suggest the closest match and explain why

Return ONLY a JSON object in this exact format:
{
  "analysis": "Brief explanation of the alternatives available",
  "alternatives": [
    {
      "productId": "${similarProducts[0].id}",
      "suitabilityScore": 0-100,
      "reason": "Professional explanation of why this is a good alternative",
      "keyConsiderations": "Any important notes about this alternative"
    }
  ]
}`;

    try {
      // Call AI for analysis
      const llm = new LLM();
      const aiResponse = await llm.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a professional pharmacist assistant. Always respond with valid JSON only, no other text.',
          },
          {
            role: 'user',
            content: aiPrompt,
          },
        ],
      });

      const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content);

      // Merge AI analysis with product data
      const alternativesWithAI = aiAnalysis.alternatives.map((alt: any) => {
        const productData = similarProducts.find(p => p.id === alt.productId);
        return {
          ...productData,
          ...alt,
        };
      });

      return successResponse({
        alternatives: alternativesWithAI,
        analysis: aiAnalysis.analysis,
        originalProduct: product,
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);

      // Fallback: return similar products without AI analysis
      const alternatives = similarProducts.map(p => ({
        ...p,
        suitabilityScore: p.activeIngredient === product.activeIngredient ? 90 : 70,
        reason: p.activeIngredient === product.activeIngredient
          ? `Contains the same active ingredient: ${p.activeIngredient}`
          : `Similar product in ${p.category} category`,
        keyConsiderations: 'AI analysis unavailable. Please consult with a pharmacist.',
      }));

      return successResponse({
        alternatives,
        analysis: 'AI analysis temporarily unavailable. Showing similar products based on category and active ingredient.',
        originalProduct: product,
      });
    }
  } catch (error) {
    console.error('Get alternatives error:', error);
    return errorResponse('SERVER_ERROR', 'Failed to get alternatives', 500);
  }
}
